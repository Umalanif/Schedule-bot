import { and, count, eq, gte, lt } from "drizzle-orm";

import { db, initDatabase } from "./client";
import { tasks } from "./schema";

export interface TaskStats {
  totalTasks: number;
}

export interface TaskSummary {
  pending: number;
  completed: number;
  cancelled: number;
  total: number;
}

export async function getTaskStats(): Promise<TaskStats> {
  initDatabase();

  const result = db.select({ totalTasks: count() }).from(tasks).get();

  return {
    totalTasks: result?.totalTasks ?? 0,
  };
}

export async function getTodayTaskSummary(): Promise<TaskSummary> {
  initDatabase();

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayTasks = db
    .select()
    .from(tasks)
    .where(and(gte(tasks.scheduledFor, start), lt(tasks.scheduledFor, end)))
    .all();

  return {
    pending: todayTasks.filter((t) => t.status === "pending").length,
    completed: todayTasks.filter((t) => t.status === "completed").length,
    cancelled: todayTasks.filter((t) => t.status === "cancelled").length,
    total: todayTasks.length,
  };
}
