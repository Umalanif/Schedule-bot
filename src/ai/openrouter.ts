import OpenAI from "openai";

import { env } from "../config/env";

export const openRouterBaseUrl = "https://openrouter.ai/api/v1";
export const openRouterChatModel = "deepseek/deepseek-v4-flash";
export const openRouterEmbeddingModel = "openai/text-embedding-3-small";
export const assistantTimeZone = "Europe/Moscow";

function formatTimePart(
  now: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: assistantTimeZone,
    ...options,
  }).format(now);
}

export function getCurrentMoscowDateTimeContext(now: Date = new Date()): string {
  const datePart = formatTimePart(now, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timePart = formatTimePart(now, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timePart} (Europe/Moscow, UTC+3)`;
}

export function prependDynamicTimeContext(systemPrompt: string): string {
  return `[System Context: Current date and time is ${getCurrentMoscowDateTimeContext()}]\n${systemPrompt}`;
}

export const openRouterClient = new OpenAI({
  baseURL: openRouterBaseUrl,
  apiKey: env.openRouterApiKey,
  defaultHeaders: {
    "X-OpenRouter-Title": "Dudoserr",
  },
});
