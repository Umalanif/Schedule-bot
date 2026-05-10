import { count } from "drizzle-orm";

import { db, initDatabase } from "./client";
import { tasks } from "./schema";

export interface TaskStats {
  totalTasks: number;
}

export async function getTaskStats(): Promise<TaskStats> {
  initDatabase();

  const result = db.select({ totalTasks: count() }).from(tasks).get();

  return {
    totalTasks: result?.totalTasks ?? 0,
  };
}
