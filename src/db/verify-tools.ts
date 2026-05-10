import { add_task, get_today_schedule } from "./tools";

async function verifyDatabaseTools(): Promise<void> {
  const userId = `verify-user-${Date.now()}`;
  const scheduledFor = new Date();
  scheduledFor.setHours(15, 0, 0, 0);

  const insertedTask = await add_task({
    userId,
    description: "Verification task",
    scheduledFor: scheduledFor.toISOString(),
  });

  const schedule = await get_today_schedule({
    userId,
    referenceDate: scheduledFor.toISOString(),
  });

  const matchedTask = schedule.find((task) => task.id === insertedTask.id);

  if (!matchedTask) {
    throw new Error("Inserted task was not returned by get_today_schedule.");
  }

  if (matchedTask.description !== insertedTask.description) {
    throw new Error("Returned task description does not match inserted task.");
  }

  console.log(
    JSON.stringify({
      insertedTaskId: insertedTask.id,
      scheduledCount: schedule.length,
      matchedTaskId: matchedTask.id,
    }),
  );
}

void verifyDatabaseTools();
