import { generateAssistantReply } from "../ai/orchestrator";
import { env } from "../config/env";
import { getTaskStats } from "../db/stats";
import { get_today_schedule } from "../db/tools";
import {
  deleteTestMemoryFact,
  forgetMemoryFact,
  getMemoryStats,
} from "../memory/maintenance";
import {
  downloadFile,
  getFile,
  getUpdates,
  sendMessage,
  setMyCommands,
  type TelegramBotCommand,
} from "./api";
import {
  appendShortTermHistory,
  clearShortTermHistory,
  getShortTermHistory,
} from "./history";
import { transcribeVoiceMessage } from "./transcription";
import type { TelegramMessage, TelegramUpdate } from "./types";

const authorizedUserId = Number(env.telegramOwnerId);

interface TelegramBotLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface TelegramBotDependencies {
  deleteTestMemoryFact: typeof deleteTestMemoryFact;
  downloadFile: typeof downloadFile;
  forgetMemoryFact: typeof forgetMemoryFact;
  generateAssistantReply: typeof generateAssistantReply;
  getFile: typeof getFile;
  getMemoryStats: typeof getMemoryStats;
  getTaskStats: typeof getTaskStats;
  getTodaySchedule: typeof get_today_schedule;
  getUpdates: typeof getUpdates;
  logger: TelegramBotLogger;
  sendMessage: typeof sendMessage;
  setMyCommands: typeof setMyCommands;
  sleep: (milliseconds: number) => Promise<void>;
  transcribeVoiceMessage: typeof transcribeVoiceMessage;
}

const defaultDependencies: TelegramBotDependencies = {
  deleteTestMemoryFact,
  downloadFile,
  forgetMemoryFact,
  generateAssistantReply,
  getFile,
  getMemoryStats,
  getTaskStats,
  getTodaySchedule: get_today_schedule,
  getUpdates,
  logger: console,
  sendMessage,
  setMyCommands,
  sleep: (milliseconds) =>
    new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    }),
  transcribeVoiceMessage,
};

const telegramMenuCommands: TelegramBotCommand[] = [
  {
    command: "start",
    description: "Show welcome message and usage guide",
  },
  {
    command: "tasks",
    description: "Show today's scheduled tasks",
  },
  {
    command: "clear",
    description: "Clear short-term conversation memory",
  },
  {
    command: "forget",
    description: "Delete a fact from long-term memory",
  },
  {
    command: "stats",
    description: "Show quick system summary",
  },
];

function isAuthorizedMessage(message: TelegramMessage): boolean {
  return message.from?.id === authorizedUserId;
}

function getMessageUserId(message: TelegramMessage): number | null {
  return message.from?.id ?? null;
}

function recordShortTermHistory(
  logger: TelegramBotLogger,
  message: TelegramMessage,
  role: "user" | "assistant",
  content: string,
): ReturnType<typeof appendShortTermHistory> {
  const userId = getMessageUserId(message);

  if (userId === null) {
    return [];
  }

  const history = appendShortTermHistory(userId, role, content);

  logger.log(
    `[telegram:history] user=${userId} entries=${history.length} role=${role}`,
  );

  return history;
}

function requireMessageUserId(message: TelegramMessage): number {
  const userId = getMessageUserId(message);

  if (userId === null) {
    throw new Error("Telegram message does not contain a user ID.");
  }

  return userId;
}

function formatWelcomeMessage(): string {
  return [
    "Dudoserr is online.",
    "",
    "Commands:",
    "/tasks - show today's tasks from SQLite",
    "/clear - clear short-term chat memory",
    "/forget <fact> - remove a saved long-term fact",
    "/stats - show tasks and memory stats",
    "",
    "You can also send text or voice messages normally.",
  ].join("\n");
}

function formatTaskList(tasks: Awaited<ReturnType<typeof get_today_schedule>>): string {
  if (tasks.length === 0) {
    return "No tasks scheduled for today.";
  }

  const lines = tasks.map((task) => {
    const scheduledAt = new Date(task.scheduledFor).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
      hour12: false,
      timeZone: "Europe/Moscow",
    });

    return `${task.id}. [${task.status}] ${scheduledAt} - ${task.description}`;
  });

  return [`Today's tasks (${tasks.length}):`, ...lines].join("\n");
}

async function handleCommand(
  dependencies: TelegramBotDependencies,
  message: TelegramMessage,
  text: string,
): Promise<boolean> {
  const userId = requireMessageUserId(message);
  const command = text.match(/^\/\S+/u)?.[0]?.toLowerCase();

  switch (command) {
    case "/start": {
      dependencies.logger.log(
        `[telegram:start] user=${userId} chat=${message.chat.id}`,
      );

      const reply = formatWelcomeMessage();
      await dependencies.sendMessage(message.chat.id, reply);
      recordShortTermHistory(dependencies.logger, message, "assistant", reply);
      return true;
    }

    case "/tasks": {
      const tasks = await dependencies.getTodaySchedule({
        userId: String(userId),
      });
      const reply = formatTaskList(tasks);
      await dependencies.sendMessage(message.chat.id, reply);
      recordShortTermHistory(dependencies.logger, message, "assistant", reply);
      return true;
    }

    case "/clear": {
      clearShortTermHistory(userId);
      const reply = "Short-term conversation memory cleared.";
      await dependencies.sendMessage(message.chat.id, reply);
      return true;
    }

    case "/forget": {
      const factQuery = text.replace(/^\/forget(?:@\S+)?\s*/iu, "").trim();

      if (!factQuery) {
        const reply = "Usage: /forget <fact text>";
        await dependencies.sendMessage(message.chat.id, reply);
        recordShortTermHistory(dependencies.logger, message, "assistant", reply);
        return true;
      }

      const forgotten = dependencies.forgetMemoryFact(factQuery);
      const deletedFacts = forgotten.deletedMemoryIds.length;
      const reply =
        deletedFacts > 0
          ? `Removed ${deletedFacts} saved fact(s) matching: ${factQuery}`
          : `No saved facts matched: ${factQuery}`;

      await dependencies.sendMessage(message.chat.id, reply);
      recordShortTermHistory(dependencies.logger, message, "assistant", reply);
      return true;
    }

    case "/stats": {
      const stats = await dependencies.getTaskStats();
      const memoryStats = dependencies.getMemoryStats();
      const reply = [
        "System summary:",
        `Total tasks in SQLite: ${stats.totalTasks}`,
        `Total facts in Mem0: ${memoryStats.totalFacts}`,
      ].join("\n");
      await dependencies.sendMessage(message.chat.id, reply);
      recordShortTermHistory(dependencies.logger, message, "assistant", reply);
      return true;
    }

    default:
      return false;
  }
}

async function generateAndSendReply(
  dependencies: TelegramBotDependencies,
  message: TelegramMessage,
  currentMessage: string,
): Promise<void> {
  const userId = requireMessageUserId(message);
  const shortTermHistory = getShortTermHistory(userId);
  const reply = await dependencies.generateAssistantReply({
    currentMessage,
    shortTermHistory,
    userId: String(userId),
  });

  await dependencies.sendMessage(message.chat.id, reply);
  recordShortTermHistory(dependencies.logger, message, "assistant", reply);
}

async function handleTextMessage(
  dependencies: TelegramBotDependencies,
  message: TelegramMessage,
): Promise<void> {
  const text = message.text?.trim();

  if (!text) {
    return;
  }

  recordShortTermHistory(dependencies.logger, message, "user", text);

  dependencies.logger.log(
    `[telegram:text] user=${message.from?.id ?? "unknown"} chat=${message.chat.id} text=${text}`,
  );

  if (await handleCommand(dependencies, message, text)) {
    return;
  }

  await generateAndSendReply(dependencies, message, text);
}

async function handleVoiceMessage(
  dependencies: TelegramBotDependencies,
  message: TelegramMessage,
): Promise<void> {
  const voice = message.voice;

  if (!voice) {
    return;
  }

  dependencies.logger.log(
    `[telegram:voice] user=${message.from?.id ?? "unknown"} chat=${message.chat.id} file=${voice.file_id}`,
  );

  const file = await dependencies.getFile(voice.file_id);

  if (!file.file_path) {
    throw new Error(`Telegram did not return file_path for voice file ${voice.file_id}`);
  }

  const audioBuffer = await dependencies.downloadFile(file.file_path);
  const transcript = await dependencies.transcribeVoiceMessage(
    audioBuffer,
    file.file_path.split("/").pop() ?? `${voice.file_unique_id}.ogg`,
    voice.mime_type,
  );

  dependencies.logger.log(
    `[telegram:transcript] user=${message.from?.id ?? "unknown"} chat=${message.chat.id} text=${transcript}`,
  );

  recordShortTermHistory(dependencies.logger, message, "user", transcript);
  await generateAndSendReply(dependencies, message, transcript);
}

async function handleMessage(
  dependencies: TelegramBotDependencies,
  message: TelegramMessage,
): Promise<void> {
  if (!isAuthorizedMessage(message)) {
    dependencies.logger.warn(
      `[telegram:ignored] unauthorized user=${message.from?.id ?? "unknown"} chat=${message.chat.id}`,
    );
    return;
  }

  if (message.text) {
    await handleTextMessage(dependencies, message);
    return;
  }

  if (message.voice) {
    await handleVoiceMessage(dependencies, message);
    return;
  }
}

export function createTelegramUpdateProcessor(
  overrides: Partial<TelegramBotDependencies> = {},
): (update: TelegramUpdate) => Promise<void> {
  const dependencies: TelegramBotDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  return async (update: TelegramUpdate): Promise<void> => {
    if (!update.message) {
      return;
    }

    await handleMessage(dependencies, update.message);
  };
}

async function processUpdate(update: TelegramUpdate): Promise<void> {
  if (!update.message) {
    return;
  }

  await createTelegramUpdateProcessor()(update);
}

export async function startTelegramBot(): Promise<void> {
  let nextOffset: number | undefined;
  const processTelegramUpdate = createTelegramUpdateProcessor();

  await defaultDependencies.setMyCommands(telegramMenuCommands);
  defaultDependencies.logger.log(
    `[telegram:startup] polling for owner=${authorizedUserId}`,
  );

  while (true) {
    try {
      const updates = await defaultDependencies.getUpdates(nextOffset);

      for (const update of updates) {
        await processTelegramUpdate(update);
        nextOffset = update.update_id + 1;
      }
    } catch (error) {
      defaultDependencies.logger.error("[telegram:error]", error);
      await defaultDependencies.sleep(3000);
    }
  }
}
