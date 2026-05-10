# 🏗️ Архитектура проекта

## 📐 Обзор архитектуры

Проект использует многоуровневую архитектуру:

```
┌─────────────────────────────────────────────────────┐
│              Telegram Bot Layer                     │
│        (telegram/bot.ts, telegram/api.ts)          │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│           Business Logic Layer                     │
│   (ai/orchestrator.ts, reminders/service.ts)      │
└──────────────┬──────────────────────────────────────┘
               │
      ┌────────┼────────┐
      │        │        │
┌─────▼──┐ ┌──▼───┐ ┌─▼─────────┐
│Database│ │Memory│ │AI Providers
│ Layer  │ │Layer │ │  (Groq,   │
│(Drizzle)│ │(Mem0)│ │ OpenRouter│
└────────┘ └──────┘ └───────────┘
```

## 🗂️ Структура модулей

### Телеграм слой (`src/telegram/`)

**Ответственность:** Взаимодействие с пользователем через Telegram API

| Файл               | Назначение                                |
| ------------------ | ----------------------------------------- |
| `bot.ts`           | Основная логика бота, обработка сообщений |
| `api.ts`           | Обертка над Telegram Bot API              |
| `types.ts`         | TypeScript типы для Telegram              |
| `history.ts`       | Хранение краткосрочной истории сообщений  |
| `transcription.ts` | Обработка голосовых сообщений             |

**Поток данных:**

```
User → Telegram API → bot.ts → orchestrator.ts → API → Response
                       ↓
                   history.ts
```

### AI слой (`src/ai/`)

**Ответственность:** Обработка текста и генерация ответов

| Файл               | Назначение                                 |
| ------------------ | ------------------------------------------ |
| `orchestrator.ts`  | Оркестрация вызовов к AI, выбор провайдера |
| `openrouter.ts`    | Интеграция с OpenRouter API                |
| `groq.ts`          | Интеграция с Groq API                      |
| `system-prompt.ts` | Системный промпт для LLM                   |

**Поток данных:**

```
Message → orchestrator.ts → [openrouter|groq|openai].ts → LLM → Response
            ↓
          system-prompt.ts (контекст)
```

### База данных (`src/db/`)

**Ответственность:** Управление данными через SQLite и Drizzle ORM

| Файл           | Назначение                        |
| -------------- | --------------------------------- |
| `client.ts`    | Инициализация Drizzle ORM клиента |
| `schema.ts`    | Определение таблиц (Tasks, etc.)  |
| `tools.ts`     | Инструменты работы с БД для AI    |
| `bootstrap.ts` | Инициализация схемы БД            |
| `stats.ts`     | Получение статистики по задачам   |

**Схема БД:**

```
┌─────────────────────┐
│      Tasks          │
├─────────────────────┤
│ id (PK)             │
│ userId              │
│ description         │
│ scheduledFor        │
│ status              │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

### Память (`src/memory/`)

**Ответственность:** Управление долгосрочной памятью через Mem0

| Файл               | Назначение                                       |
| ------------------ | ------------------------------------------------ |
| `client.ts`        | Инициализация клиента Mem0                       |
| `maintenance.ts`   | Управление памятью (добавить, удалить, очистить) |
| `verify-memory.ts` | Проверка подключения к Mem0                      |

**Интеграция:**

```
User Message → AI Orchestrator → Memory Client
                                  ↓
                          Retrieve Context
                          ↓
                          Generate Response
```

### Напоминания (`src/reminders/`)

**Ответственность:** Управление расписанием и напоминаниями

| Файл         | Назначение                               |
| ------------ | ---------------------------------------- |
| `service.ts` | Сервис напоминаний с cron-ии выражениями |

**Расписание:**

```
08:20 - Morning routine
11:30 - Break context
13:00 - Afternoon context
18:00 - End of workday
...
```

## 🔄 Основные потоки данных

### 1. Получение текстового сообщения

```typescript
// 1. Telegram получает сообщение
User: "Добавь задачу..."
        ↓
// 2. bot.ts обрабатывает
onMessage(update)
        ↓
// 3. Получить контекст из памяти и БД
getMemoryContext()
getTodaySchedule()
        ↓
// 4. Отправить в AI для обработки
generateAssistantReply(message, context)
        ↓
// 5. AI выбирает подходящий инструмент
add_task() / update_task() / get_schedule()
        ↓
// 6. Обновить БД
db.insert() / db.update()
        ↓
// 7. Отправить ответ пользователю
sendMessage(chatId, response)
```

### 2. Получение голосового сообщения

```
User: [Voice Message]
        ↓
downloadFile(voiceFileId)
        ↓
transcribeVoiceMessage(audioBuffer)  // Whisper API
        ↓
[Как текстовое сообщение из пункта 1]
```

### 3. Автоматическое напоминание

```
cron trigger (08:20)
        ↓
getReminderMessage(timeBlock)
        ↓
getMorningContext()
        ↓
sendMessage(ownerId, reminderWithContext)
```

## 🔌 Точки интеграции

### Telegram API

```typescript
// Получение обновлений
GET /getUpdates
    ↓
// Отправка сообщения
POST /sendMessage { chat_id, text, ... }
    ↓
// Скачивание файла
GET /getFile
    ↓
// Загрузка файла
POST /upload
```

### AI Провайдеры

**OpenRouter:**

```typescript
POST https://openrouter.ai/api/v1/chat/completions
{
  model: "mistral-7b",
  messages: [{ role, content }],
  tools: [definitions]
}
```

**Groq:**

```typescript
POST https://api.groq.com/openai/v1/chat/completions
{
  model: "mixtral-8x7b",
  messages: [{ role, content }]
}
```

### Mem0 Memory

```typescript
POST https://api.mem0.ai/v1/memories
{
  memory: "fact to remember",
  user_id: "123"
}
```

## 📊 Диаграмма состояния задачи

```
┌─────────┐
│ pending │  (Новая задача)
└────┬────┘
     │
     ├── "completed" → ┌───────────┐
     │                 │completed  │
     │                 └───────────┘
     │
     └── "cancelled" → ┌───────────┐
                       │ cancelled │
                       └───────────┘
```

## 🔐 Безопасность

### Аутентификация

```typescript
// Только владелец может использовать бота
if (userId !== env.telegramOwnerId) {
  return "Unauthorized";
}
```

### Обработка ошибок

```typescript
try {
  // Выполнить операцию
} catch (error) {
  console.error("[module]", error);
  // Отправить безопасное сообщение пользователю
  sendMessage(chatId, "Произошла ошибка");
}
```

### Конфиденциальность API ключей

```typescript
// ✅ Хорошо
const apiKey = env.telegramBotToken;

// ❌ Плохо
console.log(apiKey); // Никогда!
```

## 🎯 Паттерны разработки

### 1. Dependency Injection (DI)

```typescript
interface TelegramBotDependencies {
  generateAssistantReply: typeof generateAssistantReply;
  sendMessage: typeof sendMessage;
  getUpdates: typeof getUpdates;
  // ...
}

// Тесты могут подменять зависимости
```

### 2. Type Safety

```typescript
// Использование TypeScript для предотвращения ошибок
type Task = typeof tasks.$inferSelect;

// Функция гарантирует типобезопасность
function createTask(data: NewTask): Task {
  // ...
}
```

### 3. Error Handling

```typescript
try {
  const result = await risky_operation();
  return result;
} catch (error) {
  logger.error("Operation failed", error);
  throw new Error("Failed to perform operation");
}
```

## 🚀 Расширяемость

### Добавление нового AI провайдера

1. Создайте `src/ai/provider-name.ts`
2. Реализуйте интерфейс `AIProvider`
3. Добавьте в `orchestrator.ts`

```typescript
// src/ai/new-provider.ts
export async function generateReply(
  message: string,
  context: AIContext,
): Promise<string> {
  // Реализация
}
```

### Добавление нового инструмента

1. Создайте инструмент в `src/db/tools.ts`
2. Добавьте определение в system prompt
3. Обработайте вызов в `orchestrator.ts`

```typescript
// src/db/tools.ts
export function new_tool(param: string): string {
  // Реализация
}
```

### Добавление новой команды

1. Добавьте обработчик в `bot.ts`
2. Зарегистрируйте в `setMyCommands`

```typescript
if (message.text === "/newcommand") {
  // Обработка
}
```

## 📈 Производительность

### Оптимизация

1. **Кэширование:**
   - История сообщений в памяти
   - Расписание обновляется один раз в день

2. **Асинхронность:**
   - Все операции с API асинхронные
   - БД запросы не блокируют

3. **Пулинг:**
   - Получение обновлений Telegram через `getUpdates`
   - Минимальная задержка обработки

## 📚 Дополнительные ресурсы

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Design Patterns](https://refactoring.guru/design-patterns)

---

**Обновлено:** May 10, 2026
