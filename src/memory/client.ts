import path from "node:path";

import { Memory, type MemoryConfig } from "mem0ai/oss";

import {
  openRouterBaseUrl,
  openRouterChatModel,
  openRouterEmbeddingModel,
} from "../ai/openrouter";
import { env } from "../config/env";

export const mem0HistoryDbPath = path.resolve(
  process.cwd(),
  "data",
  "mem0-history.db",
);

export const mem0VectorDbPath = path.resolve(
  process.cwd(),
  "data",
  "mem0-vectors.db",
);

export const mem0Config: Partial<MemoryConfig> = {
  embedder: {
    provider: "openai",
    config: {
      apiKey: env.openRouterApiKey,
      baseURL: openRouterBaseUrl,
      model: openRouterEmbeddingModel,
      embeddingDims: 1536,
    },
  },
  vectorStore: {
    provider: "memory",
    config: {
      collectionName: "telegram_assistant_memories",
      dbPath: mem0VectorDbPath,
      dimension: 1536,
    },
  },
  llm: {
    provider: "openai",
    config: {
      apiKey: env.openRouterApiKey,
      baseURL: openRouterBaseUrl,
      model: openRouterChatModel,
    },
  },
  historyDbPath: mem0HistoryDbPath,
  customInstructions:
    "Extract durable user preferences, plans, identity facts, and recurring habits. Ignore one-off chatter.",
};

export const memoryClient = new Memory(mem0Config);
