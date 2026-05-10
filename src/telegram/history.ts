export type ShortTermHistoryRole = "user" | "assistant";

export interface ShortTermHistoryEntry {
  role: ShortTermHistoryRole;
  content: string;
  createdAt: string;
}

const maxShortTermHistoryEntries = 12;
const shortTermHistoryStore = new Map<number, ShortTermHistoryEntry[]>();

export function appendShortTermHistory(
  userId: number,
  role: ShortTermHistoryRole,
  content: string,
): ShortTermHistoryEntry[] {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    return getShortTermHistory(userId);
  }

  const nextHistory = [
    ...getShortTermHistory(userId),
    {
      role,
      content: normalizedContent,
      createdAt: new Date().toISOString(),
    },
  ].slice(-maxShortTermHistoryEntries);

  shortTermHistoryStore.set(userId, nextHistory);
  return [...nextHistory];
}

export function getShortTermHistory(userId: number): ShortTermHistoryEntry[] {
  return [...(shortTermHistoryStore.get(userId) ?? [])];
}

export function clearShortTermHistory(userId: number): void {
  shortTermHistoryStore.delete(userId);
}
