import cron from "node-cron";

import { env } from "../config/env";
import type { Task } from "../db/schema";
import { get_tasks_in_range } from "../db/tools";
import { sendMessage } from "../telegram/api";

const ownerChatId = Number(env.telegramOwnerId);
const assistantTimeZone = "Europe/Moscow";
const maxTimeoutMilliseconds = 2_147_483_647;

interface ReminderLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface ScheduleReminderInput {
  chatId?: number;
  message: string;
  triggerTime: string;
}

interface ReminderServiceDependencies {
  logger: ReminderLogger;
  sendMessage: typeof sendMessage;
}

interface DailyContextSwitchTrigger {
  cronExpression: string;
  key: string;
  message: string;
  nextBlock?: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
}

const defaultDependencies: ReminderServiceDependencies = {
  logger: console,
  sendMessage,
};

const dailyContextSwitchTriggers: DailyContextSwitchTrigger[] = [
  {
    cronExpression: "20 8 * * *",
    key: "morning-routine",
    message:
      "10 minutes left in the morning routine. Next up: Deep Work. Prepare to focus.",
    nextBlock: {
      startHour: 8,
      startMinute: 30,
      endHour: 11,
      endMinute: 30,
    },
  },
  {
    cronExpression: "20 11 * * *",
    key: "deep-work",
    message:
      "10 minutes left of Deep Work. Finish your thought, save your progress. Long break and walk start at 11:30.",
    nextBlock: {
      startHour: 11,
      startMinute: 30,
      endHour: 13,
      endMinute: 0,
    },
  },
  {
    cronExpression: "50 12 * * *",
    key: "long-break",
    message:
      "Break is almost over. Routine tasks and bugfixes start in 10 minutes.",
    nextBlock: {
      startHour: 13,
      startMinute: 0,
      endHour: 14,
      endMinute: 30,
    },
  },
  {
    cronExpression: "20 14 * * *",
    key: "routine-work",
    message:
      "10 minutes left of routine work. Next up: Free slot / Optional 2nd Deep Work. Wrap up minor tasks.",
    nextBlock: {
      startHour: 14,
      startMinute: 30,
      endHour: 18,
      endMinute: 0,
    },
  },
  {
    cronExpression: "50 17 * * *",
    key: "end-of-day",
    message:
      "10 minutes until the end of the work day! Wrap up your processes. We will review tasks at 18:00.",
  },
  {
    cronExpression: "0 18 * * *",
    key: "end-of-day-review",
    message:
      "Work day is over. What tasks from today should we mark as completed?",
  },
];

function scheduleTimeout(
  callback: () => void,
  delayMilliseconds: number,
): NodeJS.Timeout {
  if (delayMilliseconds <= maxTimeoutMilliseconds) {
    return setTimeout(callback, delayMilliseconds);
  }

  return setTimeout(() => {
    scheduleTimeout(callback, delayMilliseconds - maxTimeoutMilliseconds);
  }, maxTimeoutMilliseconds);
}

function formatLocalDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: assistantTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!offsetPart) {
    throw new Error(`Unable to determine offset for ${timeZone}.`);
  }

  const normalizedOffset = offsetPart.replace("GMT", "");

  if (!normalizedOffset || normalizedOffset === "0") {
    return 0;
  }

  const match = normalizedOffset.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/u);

  if (!match) {
    throw new Error(`Unsupported timezone offset format: ${offsetPart}`);
  }

  const [, sign, hours, minutes] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes ?? "0");

  return sign === "-" ? -totalMinutes : totalMinutes;
}

function createLocalDate(dateKey: string, hour: number, minute: number): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }

  const approximateUtc = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0, 0),
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(approximateUtc, assistantTimeZone);

  return new Date(approximateUtc.getTime() - offsetMinutes * 60_000);
}

function formatUpcomingTasks(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "";
  }

  const lines = tasks.map((task) => {
    const scheduledAt = new Date(task.scheduledFor).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: assistantTimeZone,
    });

    return `${scheduledAt} ${task.description}`;
  });

  return ` Upcoming tasks: ${lines.join("; ")}.`;
}

async function buildContextSwitchMessage(
  trigger: DailyContextSwitchTrigger,
  now: Date,
): Promise<string> {
  if (!trigger.nextBlock) {
    return trigger.message;
  }

  try {
    const dateKey = formatLocalDateKey(now);
    const tasks = await get_tasks_in_range({
      userId: String(ownerChatId),
      start: createLocalDate(
        dateKey,
        trigger.nextBlock.startHour,
        trigger.nextBlock.startMinute,
      ).toISOString(),
      end: createLocalDate(
        dateKey,
        trigger.nextBlock.endHour,
        trigger.nextBlock.endMinute,
      ).toISOString(),
      status: "pending",
    });

    return `${trigger.message}${formatUpcomingTasks(tasks)}`;
  } catch {
    return trigger.message;
  }
}

export function startStaticDailyReminders(
  overrides: Partial<ReminderServiceDependencies> = {},
): void {
  const dependencies: ReminderServiceDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  for (const trigger of dailyContextSwitchTriggers) {
    cron.schedule(
      trigger.cronExpression,
      () => {
        void buildContextSwitchMessage(trigger, new Date())
          .then((message) => dependencies.sendMessage(ownerChatId, message))
          .catch((error) => {
            dependencies.logger.error(
              `[reminder:daily:error] type=${trigger.key}`,
              error,
            );
          });
      },
      {
        timezone: assistantTimeZone,
      },
    );
  }

  cron.schedule('30 7 * * *', () => {
    void dependencies
      .sendMessage(ownerChatId, 'Доброе утро! Какие задачи планируешь на сегодня?')
      .catch((error) => {
        dependencies.logger.error('[reminder:morning] failed to send message', error);
      });
  }, { timezone: assistantTimeZone });

  dependencies.logger.log(
    `[reminder:daily] active timezone=${assistantTimeZone} chat=${ownerChatId} triggers=${dailyContextSwitchTriggers.length}`,
  );
}

export async function scheduleReminder(
  input: ScheduleReminderInput,
  overrides: Partial<ReminderServiceDependencies> = {},
): Promise<{
  chatId: number;
  delayMilliseconds: number;
  triggerTime: string;
}> {
  const dependencies: ReminderServiceDependencies = {
    ...defaultDependencies,
    ...overrides,
  };
  const chatId = input.chatId ?? ownerChatId;
  const triggerDate = new Date(input.triggerTime);
  const delayMilliseconds = triggerDate.getTime() - Date.now();

  if (Number.isNaN(triggerDate.getTime())) {
    throw new Error("Invalid trigger_time. Expected an ISO 8601 datetime string.");
  }

  if (delayMilliseconds <= 0) {
    throw new Error("trigger_time must be in the future.");
  }

  scheduleTimeout(() => {
    void dependencies
      .sendMessage(chatId, input.message)
      .then(() => {
        dependencies.logger.log(
          `[reminder:sent] chat=${chatId} trigger=${triggerDate.toISOString()}`,
        );
      })
      .catch((error) => {
        dependencies.logger.error(
          `[reminder:send-error] chat=${chatId} trigger=${triggerDate.toISOString()}`,
          error,
        );
      });
  }, delayMilliseconds);

  dependencies.logger.log(
    `[reminder:scheduled] chat=${chatId} trigger=${triggerDate.toISOString()}`,
  );

  return {
    chatId,
    delayMilliseconds,
    triggerTime: triggerDate.toISOString(),
  };
}
