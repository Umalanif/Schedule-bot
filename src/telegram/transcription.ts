import { groqClient, groqTranscriptionModel } from "../ai/groq";

export async function transcribeVoiceMessage(
  audioBuffer: Buffer,
  _fileName: string,
  _mimeType = "audio/ogg",
): Promise<string> {
  const fileBytes = Uint8Array.from(audioBuffer);

  const transcription = await groqClient.audio.transcriptions.create({
    file: new File([fileBytes], "voice.ogg", { type: "audio/ogg" }),
    model: groqTranscriptionModel,
    response_format: "verbose_json",
  });

  const transcript = transcription.text.trim();

  if (!transcript) {
    throw new Error("Groq transcription returned an empty transcript");
  }

  return transcript;
}
