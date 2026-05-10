import { openRouterChatModel, openRouterClient } from "../ai/openrouter";
import { systemPrompt } from "../ai/system-prompt";
import { memoryClient } from "./client";

async function verifyMemoryAndOpenRouter(): Promise<void> {
  const userId = `verify-user-${Date.now()}`;
  const favoriteDrink = "jasmine tea";
  const memoryText = `The user's favorite drink is ${favoriteDrink}.`;

  await memoryClient.reset();

  await memoryClient.add(memoryText, {
    userId,
  });

  const memorySearch = await memoryClient.search("favorite drink", {
    topK: 5,
    filters: {
      user_id: userId,
    },
  });

  const matchedMemory = memorySearch.results.find((entry) =>
    entry.memory.toLowerCase().includes(favoriteDrink),
  );

  if (!matchedMemory) {
    throw new Error("Memory search did not return the inserted favorite drink.");
  }

  const memoryContext = memorySearch.results
    .map((entry) => `- ${entry.memory}`)
    .join("\n");

  const completion = await openRouterClient.chat.completions.create({
    model: openRouterChatModel,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "system",
        content: `Retrieved memory context:\n${memoryContext}`,
      },
      {
        role: "user",
        content: "What is my favorite drink?",
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content?.trim();

  if (!responseText) {
    throw new Error("OpenRouter returned an empty response.");
  }

  if (!responseText.toLowerCase().includes(favoriteDrink)) {
    throw new Error("OpenRouter response did not acknowledge the retrieved memory.");
  }

  console.log(
    JSON.stringify({
      userId,
      retrievedMemories: memorySearch.results.length,
      matchedMemoryId: matchedMemory.id,
      responseText,
    }),
  );
}

void verifyMemoryAndOpenRouter();
