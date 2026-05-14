import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions/completions";

import {
  add_task,
  add_multiple_tasks,
  addTaskSchema,
  addMultipleTasksSchema,
  get_today_schedule,
  getTodayScheduleSchema,
  update_task_status,
  updateTaskStatusSchema,
} from "../db/tools";
import { memoryClient } from "../memory/client";
import { getAllMemoryFacts } from "../memory/maintenance";
import type { ShortTermHistoryEntry } from "../telegram/history";
import {
  openRouterChatModel,
  openRouterClient,
  getCurrentMoscowDateTimeContext,
  prependDynamicTimeContext,
} from "./openrouter";
import { scheduleReminder } from "../reminders/service";
import { systemPrompt } from "./system-prompt";

interface AssistantLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface AssistantOrchestratorDependencies {
  logger: AssistantLogger;
  memoryClient: typeof memoryClient;
  openRouterClient: typeof openRouterClient;
}

export interface GenerateAssistantReplyInput {
  currentMessage: string;
  shortTermHistory: ShortTermHistoryEntry[];
  userId: string;
}

const maxToolRounds = 4;

const defaultDependencies: AssistantOrchestratorDependencies = {
  logger: console,
  memoryClient,
  openRouterClient,
};

const assistantTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a scheduled task for the Telegram user.",
      parameters: addTaskSchema,
    },
  },
  {
    type: "function",
    function: {
      name: "add_multiple_tasks",
      description: "Create multiple scheduled tasks for the Telegram user in one batch.",
      parameters: addMultipleTasksSchema,
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_schedule",
      description: "Return the Telegram user's tasks scheduled for today.",
      parameters: getTodayScheduleSchema,
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Mark a task as completed or cancelled by task ID.",
      parameters: updateTaskStatusSchema,
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_reminder",
      description: "Schedule a one-off Telegram reminder for a specific future datetime.",
      parameters: {
        type: "object",
        properties: {
          trigger_time: {
            type: "string",
            description: "ISO 8601 datetime for when the reminder should be sent.",
          },
          message: {
            type: "string",
            description: "Reminder text to send to the user's Telegram chat.",
          },
        },
        required: ["trigger_time", "message"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_memories",
      description: "List all facts stored in the user's long-term memory.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
];

type TaskCreationFeedback = {
  successMessages: string[];
  failureMessages: string[];
};

type ExecutedToolResult = {
  serialized: string;
  taskCreationFeedback?: TaskCreationFeedback;
};

function formatCurrentTimeContext(): string {
  const now = new Date();

  return [
    "Runtime context:",
    `- Current server datetime: ${now.toISOString()}`,
    `- Current user datetime in UTC+3: ${getCurrentMoscowDateTimeContext(now)}`,
    "- Interpret relative dates for the user in UTC+3.",
    "- When creating tasks, always provide scheduledFor as an ISO 8601 datetime.",
    "- When scheduling reminders, always provide trigger_time as an ISO 8601 datetime.",
  ].join("\n");
}

function normalizeConversationHistory(
  shortTermHistory: ShortTermHistoryEntry[],
  currentMessage: string,
): ChatCompletionMessageParam[] {
  const normalizedCurrentMessage = currentMessage.trim();
  const historyMessages = shortTermHistory
    .filter((entry) => entry.content.trim())
    .map<ChatCompletionMessageParam>((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

  const latestEntry = shortTermHistory[shortTermHistory.length - 1];

  if (latestEntry?.role === "user" && latestEntry.content.trim() === normalizedCurrentMessage) {
    return historyMessages;
  }

  return [
    ...historyMessages,
    {
      role: "user",
      content: normalizedCurrentMessage,
    },
  ];
}

function serializeForModel(value: unknown): string {
  return JSON.stringify(
    value,
    (_, currentValue) => {
      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }

      return currentValue;
    },
    2,
  );
}

function formatScheduledTaskTime(value: unknown): string {
  const scheduledFor = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(scheduledFor.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(scheduledFor);
}

function normalizeErrorReason(error: unknown): string | null {
  const rawReason = String(error).trim().replace(/^Error:\s*/i, "");

  if (!rawReason || rawReason === "undefined" || rawReason === "null") {
    return null;
  }

  return rawReason.endsWith(".") ? rawReason : `${rawReason}.`;
}

function formatTaskAddedMessage(title: string, scheduledFor: unknown): string {
  return `✅ Task added: ${title}\nTime: ${formatScheduledTaskTime(scheduledFor)}`;
}

function formatTaskFailedMessage(title: string, reason?: string | null): string {
  return reason
    ? `❌ Could not add task "${title}". ${reason}`
    : `❌ Could not add task "${title}".`;
}

function buildTaskCreationReply(feedback: TaskCreationFeedback): string | null {
  const messages = [...feedback.successMessages, ...feedback.failureMessages].filter(Boolean);

  if (messages.length === 0) {
    return null;
  }

  return messages.join("\n\n");
}

async function loadRelevantMemoryContext(
  dependencies: AssistantOrchestratorDependencies,
  userId: string,
  query: string,
): Promise<string | null> {
  try {
    const memorySearch = await dependencies.memoryClient.search(query, {
      topK: 5,
      filters: {
        user_id: userId,
      },
    });

    if (memorySearch.results.length === 0) {
      dependencies.logger.log(`[assistant:memory] user=${userId} matches=0`);
      return null;
    }

    dependencies.logger.log(
      `[assistant:memory] user=${userId} matches=${memorySearch.results.length}`,
    );

    const memoryContext = memorySearch.results
      .map((entry) => `- ${entry.memory}`)
      .join("\n");

    return `Retrieved durable memory context:\n${memoryContext}`;
  } catch (error) {
    dependencies.logger.warn(`[assistant:memory:error] user=${userId}`, error);
    return null;
  }
}

function persistConversationMemory(
  dependencies: AssistantOrchestratorDependencies,
  userId: string,
  userMessage: string,
  assistantReply: string,
): void {
  void dependencies.memoryClient
    .add(
      [
        {
          role: "user",
          content: userMessage,
        },
        {
          role: "assistant",
          content: assistantReply,
        },
      ],
      {
        userId,
      },
    )
    .then(() => {
      dependencies.logger.log(`[assistant:memory:stored] user=${userId}`);
    })
    .catch((error) => {
      dependencies.logger.warn(`[assistant:memory:store-error] user=${userId}`, error);
    });
}

async function executeToolCall(
  dependencies: AssistantOrchestratorDependencies,
  toolCall: ChatCompletionMessageToolCall,
  userId: string,
): Promise<ExecutedToolResult> {
  if (toolCall.type !== "function") {
    return {
      serialized: serializeForModel({
        ok: false,
        error: `Unsupported tool call type: ${toolCall.type}`,
      }),
    };
  }

  let parsedArguments: Record<string, unknown>;

  try {
    parsedArguments = JSON.parse(toolCall.function.arguments);
  } catch (error) {
    return {
      serialized: serializeForModel({
        ok: false,
        error: "Tool arguments were not valid JSON.",
        details: String(error),
      }),
    };
  }

  dependencies.logger.log(
    `[assistant:tool] user=${userId} name=${toolCall.function.name}`,
  );

  try {
    switch (toolCall.function.name) {
      case "add_task": {
        const task = await add_task({
          userId,
          description: String(parsedArguments.description ?? ""),
          scheduledFor: String(parsedArguments.scheduledFor ?? ""),
        });

        return {
          serialized: serializeForModel({
            ok: true,
            task,
          }),
          taskCreationFeedback: {
            successMessages: [formatTaskAddedMessage(task.description, task.scheduledFor)],
            failureMessages: [],
          },
        };
      }

      case "add_multiple_tasks": {
        const parsedTasks = Array.isArray(parsedArguments.tasks)
          ? parsedArguments.tasks
          : [];
        const tasks = await add_multiple_tasks({
          userId,
          tasks: parsedTasks.map((task) => ({
            description: String((task as Record<string, unknown>).description ?? ""),
            scheduledFor: String((task as Record<string, unknown>).scheduledFor ?? ""),
          })),
        });

        return {
          serialized: serializeForModel({
            ok: true,
            tasks,
          }),
          taskCreationFeedback: {
            successMessages: tasks.map((task) =>
              formatTaskAddedMessage(task.description, task.scheduledFor),
            ),
            failureMessages: [],
          },
        };
      }

      case "get_today_schedule": {
        const referenceDate =
          typeof parsedArguments.referenceDate === "string"
            ? parsedArguments.referenceDate
            : undefined;
        const tasks = await get_today_schedule({
          userId,
          ...(referenceDate ? { referenceDate } : {}),
        });

        return {
          serialized: serializeForModel({
            ok: true,
            tasks,
          }),
        };
      }

      case "update_task_status": {
        const task = await update_task_status({
          taskId: Number(parsedArguments.taskId),
          status: String(parsedArguments.status) as
            | "pending"
            | "completed"
            | "cancelled",
        });

        return {
          serialized: serializeForModel({
            ok: true,
            task,
          }),
        };
      }

      case "schedule_reminder": {
        const reminder = await scheduleReminder({
          message: String(parsedArguments.message ?? ""),
          triggerTime: String(parsedArguments.trigger_time ?? ""),
        });

        return {
          serialized: serializeForModel({
            ok: true,
            reminder,
          }),
        };
      }

      case "list_memories": {
        const facts = getAllMemoryFacts();

        return {
          serialized: serializeForModel({
            ok: true,
            totalFacts: facts.length,
            facts,
          }),
        };
      }

      default:
        return {
          serialized: serializeForModel({
            ok: false,
            error: `Unknown tool name: ${toolCall.function.name}`,
          }),
        };
    }
  } catch (error) {
    const description = String(parsedArguments.description ?? "");
    const parsedTasks = Array.isArray(parsedArguments.tasks)
      ? parsedArguments.tasks
      : [];
    const reason = normalizeErrorReason(error);
    const taskCreationFeedback =
      toolCall.function.name === "add_task"
        ? {
            successMessages: [],
            failureMessages: [formatTaskFailedMessage(description, reason)],
          }
        : toolCall.function.name === "add_multiple_tasks"
          ? {
              successMessages: [],
              failureMessages: parsedTasks.map((task) =>
                formatTaskFailedMessage(
                  String((task as Record<string, unknown>).description ?? ""),
                  reason,
                ),
              ),
            }
          : undefined;

    return taskCreationFeedback
      ? {
          serialized: serializeForModel({
            ok: false,
            error: `Tool execution failed for ${toolCall.function.name}.`,
            details: String(error),
          }),
          taskCreationFeedback,
        }
      : {
          serialized: serializeForModel({
            ok: false,
            error: `Tool execution failed for ${toolCall.function.name}.`,
            details: String(error),
          }),
        };
  }
}

export async function generateAssistantReply(
  input: GenerateAssistantReplyInput,
  overrides: Partial<AssistantOrchestratorDependencies> = {},
): Promise<string> {
  const dependencies: AssistantOrchestratorDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  const memoryContext = await loadRelevantMemoryContext(
    dependencies,
    input.userId,
    input.currentMessage,
  );

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: prependDynamicTimeContext(systemPrompt),
    },
    {
      role: "system",
      content: formatCurrentTimeContext(),
    },
    ...(memoryContext
      ? [
          {
            role: "system" as const,
            content: memoryContext,
          },
        ]
      : []),
    ...normalizeConversationHistory(input.shortTermHistory, input.currentMessage),
  ];

  for (let round = 0; round < maxToolRounds; round += 1) {
    const completion = await dependencies.openRouterClient.chat.completions.create({
      model: openRouterChatModel,
      messages,
      parallel_tool_calls: false,
      tool_choice: "auto",
      tools: assistantTools,
    });

    const assistantMessage = completion.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error("OpenRouter returned no assistant message.");
    }

    const responseText = assistantMessage.content?.trim();
    const toolCalls = assistantMessage.tool_calls ?? [];

    if (toolCalls.length === 0) {
      if (!responseText) {
        throw new Error("OpenRouter returned an empty assistant response.");
      }

      persistConversationMemory(
        dependencies,
        input.userId,
        input.currentMessage,
        responseText,
      );

      return responseText;
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content,
      tool_calls: toolCalls,
    });

    const taskCreationFeedback: TaskCreationFeedback = {
      successMessages: [],
      failureMessages: [],
    };

    for (const toolCall of toolCalls) {
      const toolResult = await executeToolCall(dependencies, toolCall, input.userId);

      taskCreationFeedback.successMessages.push(
        ...(toolResult.taskCreationFeedback?.successMessages ?? []),
      );
      taskCreationFeedback.failureMessages.push(
        ...(toolResult.taskCreationFeedback?.failureMessages ?? []),
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult.serialized,
      });
    }

    const includesOnlyTaskCreationCalls = toolCalls.every(
      (toolCall) =>
        toolCall.type === "function" &&
        (toolCall.function.name === "add_task" ||
          toolCall.function.name === "add_multiple_tasks"),
    );

    if (includesOnlyTaskCreationCalls) {
      const reply = buildTaskCreationReply(taskCreationFeedback);

      if (reply) {
        persistConversationMemory(
          dependencies,
          input.userId,
          input.currentMessage,
          reply,
        );

        return reply;
      }
    }
  }

  throw new Error("Assistant exceeded the maximum tool-calling rounds.");
}
