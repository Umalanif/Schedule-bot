# Schedule Bot

A personal Telegram AI assistant for daily schedule management. Built for one user — designed to help plan tasks, track progress, and send smart reminders throughout the day.

> ⚠️ This is a personal pet-project. It is not actively maintained as a public product and is shared as a portfolio reference only.

## Features

- **Voice & text interaction** — send voice messages or text; Groq Whisper transcribes voice to text automatically
- **AI assistant** — powered by DeepSeek via OpenRouter; understands natural language for task management
- **Long-term memory** — remembers your preferences and context across sessions via Mem0
- **Task management** — add, list, complete, and cancel tasks stored in a local SQLite database
- **Task decomposition** — ask the bot to break a large project into steps and it schedules all subtasks at once
- **Dynamic reminders** — tell the bot "remind me at 15:30" and it sets a one-time timer automatically
- **Daily schedule context** — the bot knows your daily routine and uses it to plan tasks intelligently
- **Fixed daily reminders** — hardcoded cron triggers at key schedule transitions throughout the day
- **End-of-day review** — at 18:00 the bot asks which tasks to mark as completed

## Stack

- **Runtime:** Node.js + TypeScript
- **Telegram:** Telegraf
- **LLM:** DeepSeek via OpenRouter
- **Voice transcription:** Groq Whisper
- **Memory:** Mem0 (OSS, local SQLite + embeddings)
- **Database:** SQLite + Drizzle ORM
- **Scheduler:** node-cron
- **Process manager:** PM2

## How It Works

1. You send a text or voice message to your Telegram bot.
2. If voice — Groq Whisper transcribes it to text.
3. The current date/time (UTC+3) is injected into the system prompt automatically.
4. Mem0 retrieves relevant long-term memories about you.
5. DeepSeek (via OpenRouter) processes your request and calls the appropriate tool (`add_task`, `schedule_reminder`, etc.).
6. The result is saved to SQLite and confirmed back to you in Telegram.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Telegram
TELEGRAM_BOT_TOKEN=        # from @BotFather
TELEGRAM_OWNER_ID=         # your numeric Telegram user ID (from @userinfobot)

# LLM provider
# OpenRouter is used for the main AI model (DeepSeek).
# Groq is used exclusively for Whisper voice transcription.
# Note: Groq also offers free-tier LLM models if you want to use it as your main provider instead.
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=        # from openrouter.ai — used for the main LLM and embeddings
GROQ_API_KEY=              # from groq.com — required for voice transcription (Whisper)

# Memory (see Customization section below for options)
MEM0_API_KEY=              # only needed if using hosted mem0.ai platform
MEM0_API_BASE=https://api.mem0.ai/v1
```

## Customization

### Daily schedule

The bot's personality, behavior rules, and your **daily schedule skeleton** are all defined in:

```
src/ai/system-prompt.ts
```

Inside, you'll find a `DEFAULT SCHEDULE` block injected into every request so the AI understands your daily context. Edit it to match your own routine:

```
DEFAULT SCHEDULE (UTC+3):
- 07:00 – 08:30: Wake up, breakfast, daily planning.
- 08:30 – 11:30: Deep Work (complex coding).
- 11:30 – 13:00: Long break (walk).
- 13:00 – 14:30: Routine tasks (bugfixes, chores).
- 14:30 – 18:00: Free slot / Optional 2nd Deep Work.
- 18:00: End of work day, task review.
- 22:30: Sleep.
```

The fixed daily cron reminders are configured in:

```
src/reminders/service.ts
```

### Memory: OSS vs hosted

This project uses **Mem0 OSS** (open-source, self-hosted). Memory is stored **locally** in a SQLite vector store and embeddings are generated via OpenRouter — no registration on mem0.ai is required, and no data leaves your server.

If you prefer the hosted mem0.ai platform (easier setup, cloud storage), you can switch by providing `MEM0_API_KEY` and `MEM0_API_BASE` in your `.env` and updating the Mem0 client initialization in `src/memory/client.ts`.

## Local Setup

```bash
git clone https://github.com/Umalanif/Schedule-bot.git
cd Schedule-bot
npm install
cp .env.example .env   # fill in your keys
npm run db:init
npm run dev
```

## Deploy on Linux Server

```bash
git clone https://github.com/Umalanif/Schedule-bot.git
cd Schedule-bot
npm install
nano .env              # create and fill in your keys
npm run db:init
npm run build
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

To check logs:
```bash
pm2 logs schedule-bot
```

To update after a code change:
```bash
git pull
npm run build
pm2 restart schedule-bot
```

## License

MIT
