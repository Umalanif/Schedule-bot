import { env } from "../config/env";
import { createTelegramUpdateProcessor } from "./bot";
import type { TelegramUpdate } from "./types";

async function verifyVoicePipeline(): Promise<void> {
  const expectedTranscript = "Schedule dentist tomorrow at 09:30";
  const expectedReply = "Scheduled dentist for tomorrow at 09:30.";
  const observedLogs: string[] = [];
  const sentMessages: Array<{ chatId: number; text: string }> = [];
  const transcriptionCalls: Array<{ fileName: string; mimeType: string | undefined }> = [];

  const processUpdate = createTelegramUpdateProcessor({
    downloadFile: async () => Buffer.from("mock-audio"),
    generateAssistantReply: async () => expectedReply,
    getFile: async (fileId) => ({
      file_id: fileId,
      file_path: "voice/test-audio.ogg",
      file_unique_id: "voice-unique",
    }),
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
    sleep: async () => undefined,
    transcribeVoiceMessage: async (_audioBuffer, fileName, mimeType) => {
      transcriptionCalls.push({ fileName, mimeType });
      return expectedTranscript;
    },
  });

  const ownerId = Number(env.telegramOwnerId);
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
      voice: {
        duration: 2,
        file_id: "voice-file-id",
        file_unique_id: "voice-unique",
        mime_type: "audio/ogg",
      },
    },
  };

  await processUpdate(update);

  const transcriptLog = observedLogs.find((entry) =>
    entry.includes("[telegram:transcript]"),
  );

  if (!transcriptLog) {
    throw new Error("Voice pipeline did not emit a transcript log entry.");
  }

  if (!transcriptLog.includes(expectedTranscript)) {
    throw new Error("Transcript log entry did not contain the expected transcript.");
  }

  const acknowledgement = sentMessages.find(
    (entry) => entry.chatId === ownerId && entry.text === expectedReply,
  );

  if (!acknowledgement) {
    throw new Error("Voice pipeline did not send the assistant reply.");
  }

  const transcriptionCall = transcriptionCalls[0];

  if (!transcriptionCall) {
    throw new Error("Voice pipeline did not call transcription.");
  }

  if (
    transcriptionCall.fileName !== "voice.ogg"
    || transcriptionCall.mimeType !== "audio/ogg"
  ) {
    throw new Error("Voice pipeline did not pass the expected OGG filename and MIME type.");
  }

  const failingMessages: Array<{ chatId: number; text: string }> = [];
  const processFailingVoiceUpdate = createTelegramUpdateProcessor({
    downloadFile: async () => Buffer.from("mock-audio"),
    generateAssistantReply: async () => expectedReply,
    getFile: async (fileId) => ({
      file_id: fileId,
      file_path: "voice/test-audio.ogg",
      file_unique_id: "voice-unique",
    }),
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
      failingMessages.push({ chatId, text });
    },
    sleep: async () => undefined,
    transcribeVoiceMessage: async () => {
      throw new Error("Groq rejected file");
    },
  });

  await processFailingVoiceUpdate(update);

  const errorReply = failingMessages.find(
    (entry) =>
      entry.chatId === ownerId
      && entry.text === "Could not process voice message. Please try again or send text.",
  );

  if (!errorReply) {
    throw new Error("Voice pipeline did not send the fallback error reply.");
  }

  console.log(
    JSON.stringify({
      replySent: true,
      transcriptLog,
      transcriptionCall,
      errorReplySent: true,
    }),
  );
}

void verifyVoicePipeline();
