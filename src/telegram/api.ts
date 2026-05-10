import { env } from "../config/env";
import type { TelegramFile, TelegramUpdate } from "./types";

const telegramApiBaseUrl = `https://api.telegram.org/bot${env.telegramBotToken}`;
const telegramFileBaseUrl = `https://api.telegram.org/file/bot${env.telegramBotToken}`;

export interface TelegramBotCommand {
  command: string;
  description: string;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

async function telegramRequest<T>(
  method: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${telegramApiBaseUrl}/${method}`, init);

  if (!response.ok) {
    throw new Error(
      `Telegram API request failed with status ${response.status} for ${method}`,
    );
  }

  const payload = (await response.json()) as TelegramApiResponse<T>;

  if (!payload.ok) {
    throw new Error(payload.description ?? `Telegram API request failed for ${method}`);
  }

  return payload.result;
}

export async function getUpdates(offset?: number): Promise<TelegramUpdate[]> {
  const searchParams = new URLSearchParams({
    timeout: "30",
  });

  if (offset !== undefined) {
    searchParams.set("offset", String(offset));
  }

  return telegramRequest<TelegramUpdate[]>(`getUpdates?${searchParams.toString()}`);
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  await telegramRequest("sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

export async function setMyCommands(commands: TelegramBotCommand[]): Promise<void> {
  await telegramRequest("setMyCommands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commands,
    }),
  });
}

export async function getFile(fileId: string): Promise<TelegramFile> {
  return telegramRequest<TelegramFile>(`getFile?file_id=${encodeURIComponent(fileId)}`);
}

export async function downloadFile(filePath: string): Promise<Buffer> {
  const response = await fetch(
    `${telegramFileBaseUrl}/${filePath.replace(/^\/+/, "")}`,
  );

  if (!response.ok) {
    throw new Error(
      `Telegram file download failed with status ${response.status} for ${filePath}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
