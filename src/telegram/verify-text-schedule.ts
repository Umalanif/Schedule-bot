import { get_today_schedule } from "../db/tools";
import { env } from "../config/env";
import { createTelegramUpdateProcessor } from "./bot";
import type { TelegramUpdate } from "./types";

const fixedNowIso = "2026-05-10T09:00:00+03:00";
const expectedPrompt = "Schedule a meeting for today at 5 PM";
const expectedScheduledForIso = "2026-05-10T17:00:00+03:00";

function withFixedDate<T>(isoDateTime: string, run: () => Promise<T>): Promise<T> {
  const originalDate = Date;
  const fixedTimestamp = new originalDate(isoDateTime).getTime();

  class FixedDate extends originalDate {
    constructor(value?: string | number | Date) {
      if (value !== undefined) {
        super(value);
        return;
      }

      super(fixedTimestamp);
    }

    static now(): number {
      return fixedTimestamp;
    }
  }

  global.Date = FixedDate as DateConstructor;

  return run().finally(() => {
    global.Date = originalDate;
  });
}

async function verifyTextScheduling(): Promise<void> {
  const ownerId = Number(env.telegramOwnerId);
  const userId = String(ownerId);
  const beforeTasks = await get_today_schedule({
    userId,
    referenceDate: fixedNowIso,
  });
  const beforeTaskIds = new Set(beforeTasks.map((task) => task.id));
  const sentMessages: Array<{ chatId: number; text: string }> = [];
  const observedLogs: string[] = [];

  const processUpdate = createTelegramUpdateProcessor({
    logger: {
      log: (...args) => {
        observedLogs.push(args.map(String).join(" "));
      },
      warn: (...args) => {
        observedLogs.push(args.map(String).join(" "));
      },
      error: (...args) => {
        observedLogs.push(args.map(String).join(" "));
      },
    },
    sendMessage: async (chatId, text) => {
      sentMessages.push({ chatId, text });
    },
  });

  const update: TelegramUpdate = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: ownerId,
        type: "private",
      },
      from: {
        first_name: "Verifier",
        id: ownerId,
        is_bot: false,
      },
      text: expectedPrompt,
    },
  };

  await withFixedDate(fixedNowIso, async () => {
    await processUpdate(update);
  });

  const afterTasks = await get_today_schedule({
    userId,
    referenceDate: fixedNowIso,
  });
  const insertedTask = afterTasks.find((task) => !beforeTaskIds.has(task.id));

  if (!insertedTask) {
    throw new Error(
      [
        "Telegram text scheduling did not create a new SQLite task.",
        `Sent replies: ${JSON.stringify(sentMessages)}`,
        `Observed logs: ${JSON.stringify(observedLogs)}`,
        `Schedule before: ${JSON.stringify(beforeTasks)}`,
        `Schedule after: ${JSON.stringify(afterTasks)}`,
      ].join("\n"),
    );
  }

  if (!insertedTask.description.toLowerCase().includes("meeting")) {
    throw new Error("Inserted task description does not reflect the requested meeting.");
  }

  if (insertedTask.status !== "pending") {
    throw new Error("Inserted task was not created with pending status.");
  }

  const insertedScheduledForIso = insertedTask.scheduledFor.toISOString();
  const expectedScheduledForUtc = new Date(expectedScheduledForIso).toISOString();

  if (insertedScheduledForIso !== expectedScheduledForUtc) {
    throw new Error(
      `Inserted task time mismatch. Expected ${expectedScheduledForUtc}, received ${insertedScheduledForIso}.`,
    );
  }

  const reply = sentMessages.find((entry) => entry.chatId === ownerId)?.text?.trim();

  if (!reply) {
    throw new Error("Telegram text scheduling did not send a confirmation reply.");
  }

  const normalizedReply = reply.toLowerCase();

  if (!normalizedReply.includes("meeting")) {
    throw new Error("Confirmation reply did not mention the scheduled meeting.");
  }

  if (
    !normalizedReply.includes("5 pm") &&
    !normalizedReply.includes("17:00") &&
    !normalizedReply.includes("5:00 pm")
  ) {
    throw new Error("Confirmation reply did not mention the scheduled time.");
  }

  console.log(
    JSON.stringify({
      insertedTaskId: insertedTask.id,
      insertedScheduledForIso,
      reply,
    }),
  );
}

void verifyTextScheduling();
