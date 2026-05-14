# AGENTS.md — Dudoserr (Schedule Bot)

## Project Overview

Single-user Telegram AI assistant for daily scheduling. TypeScript + Node.js, CJS modules. No test framework.

## Critical Gotchas

- **`.env` uses colon-delimited key-value pairs**, not `=`. The custom parser in `src/config/env.ts` splits on the first `:` per line. Example: `bot_id:123456:TOKEN_HERE` — the value is everything after the first colon. The `.env.example` file is misleading; it shows `KEY=value` format but the actual runtime reads `KEY:value`.
- **Env var names don't match `.env.example`**. The code reads: `bot_id`, `Id`, `Groq_api`, `deepseek-v4-flash_api`. The example file shows different names (`TELEGRAM_BOT_TOKEN`, etc.).
- **`npm run dev` builds then starts** — there is no watch/hot-reload mode. Every change requires a manual restart.
- **No tests** — `"test"` script echoes "No tests configured". Don't attempt to run test suites.

## Commands

```bash
npm run build          # tsc only
npm run dev            # build + start
npm run start          # node dist/index.js (must build first)
npm run db:init        # build + run db/bootstrap.js (required on first setup)
```

## Architecture

```
src/
  index.ts             # Entry: starts reminders + Telegram long-polling loop
  config/env.ts        # .env loading (dotenv + custom colon parser)
  ai/
    system-prompt.ts   # Bot personality, schedule skeleton, tool rules — edit here for behavior changes
    orchestrator.ts    # LLM tool-calling loop (max 4 rounds), memory injection, task feedback
    openrouter.ts      # OpenRouter client, model config, Moscow timezone helpers
    groq.ts            # Groq client (voice transcription only)
  db/
    client.ts          # better-sqlite3 + Drizzle, raw CREATE TABLE in initDatabase()
    schema.ts          # Drizzle schema (single `tasks` table)
    tools.ts           # DB query functions exposed as LLM tool implementations
    bootstrap.ts       # CLI script: verifies DB init
  memory/
    client.ts          # Mem0 OSS config (local SQLite + OpenRouter embeddings)
    maintenance.ts     # /forget and /stats memory commands
  reminders/
    service.ts         # Hardcoded cron reminders (node-cron, Europe/Moscow) + one-off timers
  telegram/
    bot.ts             # Long-polling update loop, command routing, auth gate (owner-only)
    api.ts             # Raw Telegram Bot API HTTP calls (no Telegraf)
    transcription.ts   # Voice → text via Groq Whisper
    history.ts         # In-memory short-term conversation history
```

## Key Design Facts

- **Single-user auth**: only `TELEGRAM_OWNER_ID` messages are processed; all others silently dropped.
- **No drizzle-kit migrations** — schema is created via raw SQL in `initDatabase()` in `client.ts`.
- **DB files** live in `data/` (gitignored). SQLite for tasks, plus two Mem0 DBs.
- **Timezone**: everything is UTC+3 / `Europe/Moscow`. Cron schedules, task formatting, and system prompt all use it.
- **LLM models**: chat = `deepseek/deepseek-v4-flash`, embedding = `openai/text-embedding-3-small`, voice = `whisper-large-v3-turbo`. All configured in `src/ai/openrouter.ts` and `src/ai/groq.ts`.
- **Module system**: CommonJS (`"type": "commonjs"` in package.json). TypeScript outputs to `dist/`.

## TypeScript Config

Strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Code must satisfy these.