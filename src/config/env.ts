import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

dotenv.config();

const envFilePath = path.resolve(process.cwd(), ".env");

function loadColonDelimitedEnvFile(): void {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const rawEnv = fs.readFileSync(envFilePath, "utf8");

  for (const line of rawEnv.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

loadColonDelimitedEnvFile();

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  telegramBotToken: readRequiredEnv("bot_id"),
  telegramOwnerId: readRequiredEnv("Id"),
  groqApiKey: readRequiredEnv("Groq_api"),
  openRouterApiKey: readRequiredEnv("deepseek-v4-flash_api"),
};
