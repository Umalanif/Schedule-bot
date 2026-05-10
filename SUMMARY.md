## SUMMARY

The project requires building a Telegram-based AI assistant capable of text and voice processing, long-term memory management, and structured task scheduling. The execution flow processes inputs via Telegraf and Groq Whisper, orchestrates context and function calling through OpenRouter (DeepSeek V4 Flash) via the OpenAI SDK, manages long-term facts using Mem0, and executes scheduling operations against a local SQLite database utilizing Drizzle ORM.

## EXECUTION PLAN

### Phase 1: Foundation & State

- [ ] **Step 1: Project Initialization & Database Schema**
- **Type:** Coupled Group
- **Requirements:** Initialize a Node.js project with TypeScript configuration. Install Drizzle ORM, better-sqlite3, and their respective types. Define the Drizzle schema for a `tasks` table (including fields for ID, description, timestamp/date, and status). Configure the Drizzle connection instance targeting a local SQLite file.
- **Key Constraints:** Must strictly use `better-sqlite3` and `drizzle-orm`. Types must be strictly defined for seamless integration with downstream LLM tool schemas.

- [ ] **Step 2: [Smoke Test] - Database Initialization**
- **Success Criteria:** Running a basic connection script successfully creates the `sqlite` database file and creates the `tasks` table without throwing errors.
- **Action:** If passes -> proceed immediately to the next step without refactoring.

### Phase 2: Core Domain Logic

- [ ] **Step 3: Database Tools Implementation**
- **Type:** Isolated
- **Requirements:** Create asynchronous TypeScript wrapper functions for the database interactions: `add_task`, `get_today_schedule`, and `update_task_status`. Define strictly typed JSON schemas for the inputs of these functions so they can be exposed as Tools to the OpenAI SDK.
- **Key Constraints:** These functions must independently execute CRUD operations using the Drizzle ORM instance from Step 1.

- [ ] **Step 4: [Smoke Test] - Tool Execution**
- **Success Criteria:** Programmatically calling `add_task` followed by `get_today_schedule` logs the correctly inserted task payload in the console.
- **Action:** If passes -> proceed immediately to the next step without refactoring.

- [ ] **Step 5: Memory & LLM Client Configuration**
- **Type:** Coupled Group
- **Requirements:** Initialize the Mem0 Node.js SDK for local long-term memory storage. Initialize the OpenAI SDK client configured to point to the OpenRouter base URL using a DeepSeek V4 Flash model string. Define the system prompt establishing the agent's role, instructions for using memory, and instructions for utilizing the database tools.
- **Key Constraints:** The OpenAI client must exclusively use OpenRouter endpoints.

- [ ] **Step 6: [Smoke Test] - LLM & Memory Integration**
- **Success Criteria:** Writing a hardcoded string to Mem0, retrieving it, and passing it alongside a test prompt to the OpenRouter client successfully returns a valid text response acknowledging the injected memory.
- **Action:** If passes -> proceed immediately to the next step without refactoring.

### Phase 3: Interface & Integration

- [ ] **Step 7: Telegram Bot & Voice Processing**
- **Type:** Coupled Group
- **Requirements:** Initialize Telegraf. Set up listeners for text and voice messages. For voice messages, implement a downloader to fetch the `.ogg` file from Telegram, then pass it to the Groq SDK (Whisper) for transcription. Implement an in-memory sliding window queue to store the last 5-10 conversational exchanges per user for short-term context.
- **Key Constraints:** Voice processing must exclusively use the Groq SDK.

- [ ] **Step 8: [Smoke Test] - Audio Ingestion pipeline**
- **Success Criteria:** Sending a test voice message to the Telegram bot results in the bot logging the correct transcribed text to the server console.
- **Action:** If passes -> proceed immediately to the next step without refactoring.

### Phase 4: System Orchestration

- [ ] **Step 9: Unified Orchestration Pipeline**
- **Type:** Coupled Group
- **Requirements:** Wire the full request lifecycle:

1. Intercept Telegraf message (transcribe if audio).
2. Query Mem0 for relevant historical facts based on the current message.
3. Package the sliding window history, retrieved Mem0 facts, system prompt, and database tools into a single OpenAI SDK request to OpenRouter.
4. Handle the LLM response: execute database tools if requested by the model, append results, and make follow-up LLM calls if necessary.
5. Send the final text response back to the user via Telegraf.
6. Fire a non-blocking, asynchronous background call to Mem0 to save new facts/preferences from the user's latest message.

- **Key Constraints:** The Mem0 update must not block the Telegraf response to the user.

- [ ] **Step 10: [Smoke Test] - End-to-End Orchestration**
- **Success Criteria:** Sending "Schedule a meeting for today at 5 PM" via Telegram text results in the bot creating the task in SQLite and replying with a confirmation in Telegram.
- **Action:** If passes -> proceed immediately to the next step without refactoring.

- [ ] **Step 11: Process Management Configuration**
- **Type:** Isolated
- **Requirements:** Create the PM2 ecosystem configuration file or required start scripts to ensure the compiled TypeScript application can run continuously in the background.
- **Key Constraints:** Must use `pm2` as specified in the stack.

- [ ] **Step 12: [Smoke Test] - PM2 Deployment**
- **Success Criteria:** Running `pm2 start` successfully launches the bot, and the bot responds to a `/start` command on Telegram while running in the background.
- **Action:** If passes -> proceed immediately to the next step without refactoring.
