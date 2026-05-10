import { toFile } from "openai/uploads";

import { groqClient, groqTranscriptionModel } from "../ai/groq";

export async function transcribeVoiceMessage(
  audioBuffer: Buffer,
  fileName: string,
  mimeType = "audio/ogg",
): Promise<string> {
  const audioFile = await toFile(audioBuffer, fileName, { type: mimeType });

  const transcription = await groqClient.audio.transcriptions.create({
    file: audioFile,
    model: groqTranscriptionModel,
    response_format: "verbose_json",
  });

  const transcript = transcription.text.trim();

  if (!transcript) {
    throw new Error("Groq transcription returned an empty transcript");
  }

  return transcript;
}
