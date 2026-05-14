import Database from "better-sqlite3";

import {
  mem0HistoryDbPath,
  mem0VectorDbPath,
} from "./client";

const testMemoryNeedle = "jasmine tea";

export interface MemoryStats {
  totalFacts: number;
}

export interface MemoryFact {
  id: string;
  memory: string;
  createdAt: string | null;
}

export interface DeletedTestMemorySummary {
  deletedHistoryRows: number;
  deletedMessageRows: number;
  deletedVectorRows: number;
  deletedEntityVectorRows: number;
  deletedMemoryIds: string[];
}

export interface ForgottenMemorySummary {
  deletedHistoryRows: number;
  deletedMessageRows: number;
  deletedVectorRows: number;
  deletedEntityVectorRows: number;
  deletedMemoryIds: string[];
  query: string;
}

function getEntityVectorDbPath(): string {
  return `${mem0VectorDbPath.replace(/\.db$/i, "")}_entities.db`;
}

function collectOrphanedEntityIds(
  vectorDb: Database.Database,
  entityVectorDb: Database.Database,
): string[] {
  const existingMemoryIds = new Set(
    (
      vectorDb
        .prepare("SELECT id FROM vectors")
        .all() as Array<{ id: string }>
    ).map((row) => row.id),
  );

  const entityRows = entityVectorDb
    .prepare("SELECT id, payload FROM vectors")
    .all() as Array<{ id: string; payload: string }>;

  return entityRows
    .filter((row) => {
      try {
        const parsedPayload = JSON.parse(String(row.payload)) as {
          linkedMemoryIds?: string[];
        };

        const linkedMemoryIds = parsedPayload.linkedMemoryIds ?? [];

        return (
          linkedMemoryIds.length > 0 &&
          linkedMemoryIds.every((linkedMemoryId) => !existingMemoryIds.has(linkedMemoryId))
        );
      } catch {
        return false;
      }
    })
    .map((row) => row.id);
}

function deleteOrphanedEntityRows(
  vectorDb: Database.Database,
  entityVectorDb: Database.Database,
): number {
  const orphanedEntityIds = collectOrphanedEntityIds(vectorDb, entityVectorDb);
  let deletedEntityVectorRows = 0;

  for (const entityId of orphanedEntityIds) {
    deletedEntityVectorRows += entityVectorDb
      .prepare("DELETE FROM vectors WHERE id = ?")
      .run(entityId).changes;
  }

  return deletedEntityVectorRows;
}

export function getMemoryStats(): MemoryStats {
  const vectorDb = new Database(mem0VectorDbPath);

  try {
    const result = vectorDb.prepare("SELECT COUNT(*) AS totalFacts FROM vectors").get() as {
      totalFacts: number;
    };

    return {
      totalFacts: result.totalFacts,
    };
  } finally {
    vectorDb.close();
  }
}

export function getAllMemoryFacts(): MemoryFact[] {
  const vectorDb = new Database(mem0VectorDbPath);

  try {
    const rows = vectorDb
      .prepare("SELECT id, payload FROM vectors")
      .all() as Array<{ id: string; payload: string }>;

    return rows.map((row) => {
      let memoryText = row.id;

      try {
        const parsed = JSON.parse(row.payload) as { memory?: string; data?: string; created_at?: string };
        memoryText = parsed.memory ?? parsed.data ?? row.id;
      } catch {
        memoryText = row.id;
      }

      return {
        id: row.id,
        memory: memoryText,
        createdAt: null,
      };
    });
  } finally {
    vectorDb.close();
  }
}

export function forgetMemoryFact(query: string): ForgottenMemorySummary {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    throw new Error("Missing memory query to forget.");
  }

  const historyDb = new Database(mem0HistoryDbPath);
  const vectorDb = new Database(mem0VectorDbPath);
  const entityVectorDb = new Database(getEntityVectorDbPath());

  try {
    const matchedHistoryRows = historyDb
      .prepare(
        `
          SELECT DISTINCT memory_id
          FROM memory_history
          WHERE lower(coalesce(new_value, '')) LIKE ?
             OR lower(coalesce(previous_value, '')) LIKE ?
        `,
      )
      .all(`%${normalizedQuery}%`, `%${normalizedQuery}%`) as Array<{ memory_id: string }>;

    const matchedMessageRows = historyDb
      .prepare(
        `
          SELECT DISTINCT session_scope
          FROM messages
          WHERE lower(coalesce(content, '')) LIKE ?
        `,
      )
      .all(`%${normalizedQuery}%`) as Array<{ session_scope: string }>;

    const memoryIds = Array.from(new Set(matchedHistoryRows.map((row) => row.memory_id)));
    const sessionScopes = Array.from(new Set(matchedMessageRows.map((row) => row.session_scope)));

    const summary: ForgottenMemorySummary = {
      deletedHistoryRows: 0,
      deletedMessageRows: 0,
      deletedVectorRows: 0,
      deletedEntityVectorRows: 0,
      deletedMemoryIds: memoryIds,
      query,
    };

    const deleteHistoryTransaction = historyDb.transaction(() => {
      summary.deletedHistoryRows = historyDb
        .prepare(
          `
            DELETE FROM memory_history
            WHERE lower(coalesce(new_value, '')) LIKE ?
               OR lower(coalesce(previous_value, '')) LIKE ?
          `,
        )
        .run(`%${normalizedQuery}%`, `%${normalizedQuery}%`).changes;

      for (const sessionScope of sessionScopes) {
        summary.deletedMessageRows += historyDb
          .prepare("DELETE FROM messages WHERE session_scope = ?")
          .run(sessionScope).changes;
      }
    });

    const deleteVectorTransaction = vectorDb.transaction(() => {
      for (const memoryId of memoryIds) {
        summary.deletedVectorRows += vectorDb
          .prepare("DELETE FROM vectors WHERE id = ?")
          .run(memoryId).changes;
      }
    });

    const deleteEntityVectorTransaction = entityVectorDb.transaction(() => {
      for (const memoryId of memoryIds) {
        summary.deletedEntityVectorRows += entityVectorDb
          .prepare("DELETE FROM vectors WHERE payload LIKE ?")
          .run(`%${memoryId}%`).changes;
      }

      summary.deletedEntityVectorRows += deleteOrphanedEntityRows(
        vectorDb,
        entityVectorDb,
      );
    });

    deleteHistoryTransaction();
    deleteVectorTransaction();
    deleteEntityVectorTransaction();

    return summary;
  } finally {
    historyDb.close();
    vectorDb.close();
    entityVectorDb.close();
  }
}

export function deleteTestMemoryFact(): DeletedTestMemorySummary {
  const historyDb = new Database(mem0HistoryDbPath);
  const vectorDb = new Database(mem0VectorDbPath);
  const entityVectorDb = new Database(getEntityVectorDbPath());

  try {
    const matchedHistoryRows = historyDb
      .prepare(
        `
          SELECT DISTINCT memory_id
          FROM memory_history
          WHERE lower(coalesce(new_value, '')) LIKE ?
             OR lower(coalesce(previous_value, '')) LIKE ?
        `,
      )
      .all(`%${testMemoryNeedle}%`, `%${testMemoryNeedle}%`) as Array<{ memory_id: string }>;

    const matchedVectorRows = vectorDb
      .prepare(
        `
          SELECT DISTINCT id
          FROM vectors
          WHERE lower(coalesce(payload, '')) LIKE ?
        `,
      )
      .all(`%${testMemoryNeedle}%`) as Array<{ id: string }>;

    const memoryIds = Array.from(
      new Set([
        ...matchedHistoryRows.map((row) => row.memory_id),
        ...matchedVectorRows.map((row) => row.id),
      ]),
    );

    const deleteSummary: DeletedTestMemorySummary = {
      deletedHistoryRows: 0,
      deletedMessageRows: 0,
      deletedVectorRows: 0,
      deletedEntityVectorRows: 0,
      deletedMemoryIds: memoryIds,
    };

    const deleteHistoryTransaction = historyDb.transaction(() => {
      deleteSummary.deletedHistoryRows = historyDb
        .prepare(
          `
            DELETE FROM memory_history
            WHERE lower(coalesce(new_value, '')) LIKE ?
               OR lower(coalesce(previous_value, '')) LIKE ?
          `,
        )
        .run(`%${testMemoryNeedle}%`, `%${testMemoryNeedle}%`).changes;

      deleteSummary.deletedMessageRows = historyDb
        .prepare(
          `
            DELETE FROM messages
            WHERE lower(coalesce(content, '')) LIKE ?
          `,
        )
        .run(`%${testMemoryNeedle}%`).changes;
    });

    const deleteVectorTransaction = vectorDb.transaction(() => {
      for (const memoryId of memoryIds) {
        deleteSummary.deletedVectorRows += vectorDb
          .prepare("DELETE FROM vectors WHERE id = ?")
          .run(memoryId).changes;
      }
    });

    const deleteEntityVectorTransaction = entityVectorDb.transaction(() => {
      deleteSummary.deletedEntityVectorRows += entityVectorDb
        .prepare(
          `
            DELETE FROM vectors
            WHERE lower(coalesce(payload, '')) LIKE ?
          `,
        )
        .run(`%${testMemoryNeedle}%`).changes;

      for (const memoryId of memoryIds) {
        deleteSummary.deletedEntityVectorRows += entityVectorDb
          .prepare("DELETE FROM vectors WHERE payload LIKE ?")
          .run(`%${memoryId}%`).changes;
      }

      deleteSummary.deletedEntityVectorRows += deleteOrphanedEntityRows(
        vectorDb,
        entityVectorDb,
      );
    });

    deleteHistoryTransaction();
    deleteVectorTransaction();
    deleteEntityVectorTransaction();

    return deleteSummary;
  } finally {
    historyDb.close();
    vectorDb.close();
    entityVectorDb.close();
  }
}
