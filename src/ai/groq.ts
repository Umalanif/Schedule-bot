import OpenAI from "openai";

import { env } from "../config/env";

export const groqBaseUrl = "https://api.groq.com/openai/v1";
export const groqTranscriptionModel = "whisper-large-v3-turbo";

export const groqClient = new OpenAI({
  baseURL: groqBaseUrl,
  apiKey: env.groqApiKey,
});
