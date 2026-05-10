import { startStaticDailyReminders } from "./reminders/service";
import { startTelegramBot } from "./telegram/bot";

startStaticDailyReminders();

void startTelegramBot().catch((error) => {
  console.error("[fatal]", error);
  process.exitCode = 1;
});
