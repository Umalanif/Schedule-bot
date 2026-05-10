import { and, asc, eq, gte, lt } from "drizzle-orm";

import { db, initDatabase } from "./client";
import { tasks, type Task } from "./schema";

export const taskStatusValues = ["pending", "completed", "cancelled"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];

type JsonSchemaProperty = {
  type?: string | string[];
  description?: string;
  enum?: readonly string[];
  items?: JsonSchemaProperty | JsonSchemaObject;
  properties?: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties?: boolean;
};

type JsonSchemaObject = {
  type: "object";
  additionalProperties: false;
  properties: Record<string, JsonSchemaProperty>;
  required: readonly string[];
};

export interface AddTaskInput {
  userId: string;
  description: string;
  scheduledFor: string;
}

export interface AddMultipleTasksInput {
  userId: string;
  tasks: Array<{
    description: string;
    scheduledFor: string;
  }>;
}

export interface GetTodayScheduleInput {
  userId: string;
  referenceDate?: string;
}

export interface GetTasksInRangeInput {
  userId: string;
  start: string;
  end: string;
  status?: TaskStatus;
}

export interface UpdateTaskStatusInput {
  taskId: number;
  status: TaskStatus;
}

export const addTaskSchema: JsonSchemaObject = {
  type: "object",
  additionalProperties: false,
  properties: {
    description: {
      type: "string",
      description: "Human-readable task description.",
    },
    scheduledFor: {
      type: "string",
      description: "ISO 8601 datetime for when the task should happen.",
    },
  },
  required: ["description", "scheduledFor"],
};

export const addMultipleTasksSchema: JsonSchemaObject = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      description: "List of tasks to create in one batch.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: {
            type: "string",
            description: "Human-readable task description.",
          },
          scheduledFor: {
            type: "string",
            description: "ISO 8601 datetime for when the task should happen.",
          },
        },
        required: ["description", "scheduledFor"],
      },
    },
  },
  required: ["tasks"],
};

export const getTodayScheduleSchema: JsonSchemaObject = {
  type: "object",
  additionalProperties: false,
  properties: {
    referenceDate: {
      type: "string",
      description: "Optional ISO 8601 datetime used to determine what counts as today.",
    },
  },
  required: [],
};

export const updateTaskStatusSchema: JsonSchemaObject = {
  type: "object",
  additionalProperties: false,
  properties: {
    taskId: {
      type: "number",
      description: "Numeric task identifier in SQLite.",
    },
    status: {
      type: "string",
      description: "New lifecycle status for the task.",
      enum: taskStatusValues,
    },
  },
  required: ["taskId", "status"],
};

function normalizeDateRange(referenceDate?: string): { start: Date; end: Date } {
  const baseDate = referenceDate ? new Date(referenceDate) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid reference date.");
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function normalizeScheduledFor(isoDateTime: string): Date {
  const scheduledFor = new Date(isoDateTime);

  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Invalid scheduledFor datetime.");
  }

  return scheduledFor;
}

function validateStatus(status: TaskStatus): TaskStatus {
  if (!taskStatusValues.includes(status)) {
    throw new Error(`Unsupported task status: ${status}`);
  }

  return status;
}

export async function add_task(input: AddTaskInput): Promise<Task> {
  initDatabase();

  const now = new Date();
  const scheduledFor = normalizeScheduledFor(input.scheduledFor);

  const insertedRows = db
    .insert(tasks)
    .values({
      userId: input.userId,
      description: input.description,
      scheduledFor,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all();

  const insertedTask = insertedRows[0];

  if (!insertedTask) {
    throw new Error("Task insertion failed.");
  }

  return insertedTask;
}

export async function add_multiple_tasks(
  input: AddMultipleTasksInput,
): Promise<Task[]> {
  initDatabase();

  if (input.tasks.length === 0) {
    return [];
  }

  const now = new Date();
  const rowsToInsert = input.tasks.map((task) => ({
    userId: input.userId,
    description: task.description,
    scheduledFor: normalizeScheduledFor(task.scheduledFor),
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
  }));

  return db.transaction((tx) =>
    tx.insert(tasks).values(rowsToInsert).returning().all(),
  );
}

export async function get_today_schedule(
  input: GetTodayScheduleInput,
): Promise<Task[]> {
  initDatabase();

  const { start, end } = normalizeDateRange(input.referenceDate);

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, input.userId),
        gte(tasks.scheduledFor, start),
        lt(tasks.scheduledFor, end),
      ),
    )
    .orderBy(asc(tasks.scheduledFor))
    .all();
}

export async function get_tasks_in_range(
  input: GetTasksInRangeInput,
): Promise<Task[]> {
  initDatabase();

  const start = normalizeScheduledFor(input.start);
  const end = normalizeScheduledFor(input.end);

  if (end <= start) {
    throw new Error("Range end must be later than range start.");
  }

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, input.userId),
        gte(tasks.scheduledFor, start),
        lt(tasks.scheduledFor, end),
        input.status ? eq(tasks.status, validateStatus(input.status)) : undefined,
      ),
    )
    .orderBy(asc(tasks.scheduledFor))
    .all();
}

export async function update_task_status(
  input: UpdateTaskStatusInput,
): Promise<Task | null> {
  initDatabase();

  const updatedRows = db
    .update(tasks)
    .set({
      status: validateStatus(input.status),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, input.taskId))
    .returning()
    .all();

  return updatedRows[0] ?? null;
}
