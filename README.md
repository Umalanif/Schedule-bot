# 🤖 Dudoserr - Telegram AI Assistant

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue)](https://www.typescriptlang.org/)

> Персональный AI-помощник в Telegram с управлением задачами, долгосрочной памятью и голосовой транскрипцией.

## 📋 Оглавление

- [Описание](#описание)
- [Возможности](#возможности)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Конфигурация](#конфигурация)
- [Использование](#использование)
- [Структура проекта](#структура-проекта)
- [Доступные команды](#доступные-команды)
- [Технологии](#технологии)
- [Разработка](#разработка)
- [Решение проблем](#решение-проблем)
- [Лицензия](#лицензия)

## 📝 Описание

**Dudoserr** — это умный Telegram-бот, разработанный для личного использования как персональный AI-ассистент. Он помогает управлять ежедневными задачами, запоминает важную информацию, предоставляет напоминания и транскрибирует голосовые сообщения.

Бот использует современные AI-модели (OpenRouter, Groq, OpenAI) и локальную базу данных SQLite для хранения информации о задачах и расписании.

## ✨ Возможности

### 🎯 Управление задачами

- ✅ Создание и планирование задач
- ✅ Просмотр дневного расписания
- ✅ Обновление статуса задач
- ✅ Отслеживание выполненных работ

### 🧠 Долгосрочная память

- 📚 Сохранение личных фактов и предпочтений
- 🔄 Интеграция с Mem0 AI для умной памяти
- 📖 Контекстное воспроизведение информации
- 🧹 Управление и очистка памяти

### 🎙️ Голосовая обработка

- 🎵 Транскрипция голосовых сообщений в текст
- 🔊 Обработка через OpenAI Whisper
- 💬 Автоматическое преобразование в текстовые команды

### 📢 Напоминания и уведомления

- ⏰ Автоматические ежедневные напоминания
- 🔔 Персонализированные уведомления о задачах
- 📅 Поддержка cron-выражений для гибкого расписания
- ⏱️ Контекстные переключения во время дня

### 🤖 AI-ассистент

- 💡 Ответы на вопросы с контекстом
- 📊 Анализ данных задач
- 🎯 Рекомендации по планированию
- 🔐 Персональный контекст и предпочтения

## 📦 Требования

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 или **yarn**
- **SQLite3** (поставляется с better-sqlite3)
- Telegram Bot Token (от [@BotFather](https://t.me/botfather))
- Ключи API для AI-провайдеров (на выбор):
  - OpenRouter API
  - Groq API
  - OpenAI API

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/Umalanif/Schedule-bot.git
cd Schedule-bot
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Создание файла конфигурации

Создайте файл `.env` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_OWNER_ID=your_telegram_user_id
AI_PROVIDER=openrouter  # или groq, openai
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
MEM0_API_KEY=your_mem0_key
MEM0_API_BASE=https://api.mem0.ai/v1
```

> Подробные инструкции по получению ключей см. в [SETUP.md](SETUP.md)

### 4. Инициализация базы данных

```bash
npm run db:init
```

### 5. Запуск бота

```bash
npm run build
npm start
```

Или в режиме разработки (требует nodemon):

```bash
npm run dev
```

## ⚙️ Конфигурация

### Переменные окружения

Все параметры конфигурации хранятся в файле `.env`:

| Переменная           | Описание                                           | Обязательная                 |
| -------------------- | -------------------------------------------------- | ---------------------------- |
| `TELEGRAM_BOT_TOKEN` | Token Telegram бота                                | ✅                           |
| `TELEGRAM_OWNER_ID`  | Telegram ID владельца (целое число)                | ✅                           |
| `AI_PROVIDER`        | Провайдер AI: `openrouter`, `groq`, `openai`       | ✅                           |
| `OPENROUTER_API_KEY` | Ключ API OpenRouter                                | При `AI_PROVIDER=openrouter` |
| `GROQ_API_KEY`       | Ключ API Groq                                      | При `AI_PROVIDER=groq`       |
| `OPENAI_API_KEY`     | Ключ API OpenAI                                    | При `AI_PROVIDER=openai`     |
| `MEM0_API_KEY`       | Ключ API Mem0 для управления памятью               | ✅                           |
| `MEM0_API_BASE`      | Base URL для Mem0 API                              | ✅                           |
| `DATABASE_PATH`      | Путь к базе данных (по умолчанию: `./data/bot.db`) | ❌                           |

### Расписание по умолчанию (Mode: Vacation)

Бот использует следующее расписание (UTC+3 Moscow):

- **07:00 - 08:30** — Пробуждение, завтрак, планирование
- **08:30 - 11:30** — Deep Work (сложное программирование)
- **11:30 - 13:00** — Длинный перерыв (прогулка)
- **13:00 - 14:30** — Рутинные задачи (исправления, дела)
- **14:30 - 18:00** — Свободный слот / опциональный второй Deep Work
- **18:00** — Конец рабочего дня, обзор задач
- **22:30** — Сон

## 📖 Использование

### Взаимодействие с ботом

После запуска бота, напишите ему в Telegram. Основные действия:

#### Управление задачами

```
"/start" — получить справку и начать работу
"/add Название задачи" — добавить новую задачу
"/schedule Задача, 14:30" — добавить задачу на конкретное время
"/today" — показать расписание на сегодня
"/tasks" — показать все активные задачи
"/done id" — отметить задачу как выполненную
"/cancel id" — отменить задачу
```

#### Информация о памяти

```
"/memory-stats" — статистика сохраненной памяти
"/forget fact-id" — удалить факт из памяти
"/clear-memory" — очистить тестовую память
```

#### Разработка и диагностика

```
"/verify-tools" — проверить доступные инструменты
"/verify-voice" — проверить обработку голоса
```

### Голосовые сообщения

Просто отправьте голосовое сообщение боту, и оно будет:

1. Автоматически транскрибировано в текст
2. Обработано как текстовое сообщение
3. Включено в контекст ответа

### Контекст расписания

Бот анализирует текущее время дня и включает релевантный контекст:

```
14:00 → "Вы в режиме Deep Work, избегайте отвлечений"
11:30 → "Начинается перерыв, рекомендуется отдохнуть"
18:00 → "Рабочий день закончился, пора отдыхать"
```

## 📂 Структура проекта

```
Schedule-bot/
├── src/
│   ├── index.ts                 # Точка входа приложения
│   ├── ai/
│   │   ├── groq.ts             # Интеграция с Groq
│   │   ├── openrouter.ts       # Интеграция с OpenRouter
│   │   ├── orchestrator.ts     # Оркестрация AI-моделей
│   │   └── system-prompt.ts    # Системный промпт для бота
│   ├── config/
│   │   └── env.ts              # Загрузка переменных окружения
│   ├── db/
│   │   ├── bootstrap.ts        # Инициализация БД
│   │   ├── client.ts           # Драйвер Drizzle ORM
│   │   ├── schema.ts           # Схема базы данных
│   │   ├── stats.ts            # Статистика по задачам
│   │   ├── tools.ts            # Инструменты работы с БД
│   │   └── verify-tools.ts     # Проверка инструментов
│   ├── memory/
│   │   ├── client.ts           # Клиент Mem0 AI
│   │   ├── maintenance.ts      # Управление памятью
│   │   ├── clean-test-memory.ts # Очистка тестовой памяти
│   │   └── verify-memory.ts    # Проверка памяти
│   ├── reminders/
│   │   └── service.ts          # Сервис напоминаний
│   └── telegram/
│       ├── api.ts              # Telegram Bot API
│       ├── bot.ts              # Основная логика бота
│       ├── history.ts          # История сообщений
│       ├── transcription.ts    # Транскрипция голоса
│       ├── types.ts            # TypeScript типы
│       ├── verify-text-schedule.ts # Проверка текстового расписания
│       └── verify-voice.ts     # Проверка голоса
├── data/
│   └── logs/                   # Логи приложения
├── dist/                       # Скомпилированный JavaScript
├── .env                        # Переменные окружения (не коммитить!)
├── .env.example               # Пример файла конфигурации
├── package.json               # Зависимости проекта
├── tsconfig.json              # Конфигурация TypeScript
├── ecosystem.config.js        # Конфигурация PM2 (опционально)
└── README.md                  # Этот файл
```

## 📋 Доступные команды

### Основные команды npm

```bash
# Сборка TypeScript кода
npm run build

# Запуск бота
npm start

# Инициализация базы данных
npm run db:init

# Проверка доступных инструментов БД
npm run db:verify-tools

# Очистка тестовой памяти
npm run memory:clean-test

# Проверка состояния памяти
npm run memory:verify

# Проверка текстового расписания
npm run telegram:verify-text-schedule

# Проверка голосовой функции
npm run voice:verify

# Запуск тестов (не настроены)
npm test
```

## 🛠️ Технологии

### Backend

- **Node.js** — JavaScript runtime
- **TypeScript** — Типизированный JavaScript
- **Telegram Bot API** — Взаимодействие с ботом

### База данных

- **SQLite3** — Легкая встроенная БД
- **Better SQLite3** — Синхронный драйвер SQLite
- **Drizzle ORM** — Type-safe ORM для Node.js

### AI и память

- **OpenRouter API** — Агрегатор AI-моделей
- **Groq API** — Высокоскоростные LLM
- **OpenAI API** — GPT и другие модели
- **Mem0 AI** — Долгосрочная память для AI

### Другое

- **node-cron** — Планировщик cron-задач
- **dotenv** — Управление переменными окружения
- **better-sqlite3** — Встроенная база данных

## 👨‍💻 Разработка

### Локальная установка для разработки

```bash
# Клонировать репозиторий
git clone https://github.com/Umalanif/Schedule-bot.git
cd Schedule-bot

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
# Отредактировать .env с вашими ключами API

# Собрать TypeScript
npm run build

# Запустить бота
npm start
```

### Типичный цикл разработки

```bash
# 1. Внести изменения в src/**/*.ts
# 2. Пересобрать код
npm run build

# 3. Запустить определенную скрипт для проверки
npm run db:verify-tools

# 4. Запустить полный бот для тестирования
npm start
```

### Добавление новых зависимостей

```bash
npm install package-name
npm install --save-dev @types/package-name
```

### Типичная структура нового модуля

```typescript
// src/new-feature/handler.ts
import { env } from "../config/env";

export async function handleNewFeature(input: string): Promise<string> {
  // Ваша логика здесь
  return "результат";
}
```

## 🐛 Решение проблем

### Бот не подключается к Telegram

**Проблема:** `Error: Failed to connect to Telegram API`

**Решение:**

1. Проверьте значение `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь, что токен скопирован полностью (без пробелов)
3. Проверьте подключение к интернету
4. Перезагрузите бота: `npm start`

### Ошибка "Missing required environment variable"

**Проблема:** `Error: Missing required environment variable: TELEGRAM_BOT_TOKEN`

**Решение:**

1. Убедитесь, что файл `.env` существует в корне проекта
2. Проверьте синтаксис `.env` (формат: `KEY:VALUE` или `KEY=VALUE`)
3. Перезагрузите приложение

### Голосовые сообщения не транскрибируются

**Проблема:** Голосовые сообщения игнорируются

**Решение:**

1. Проверьте наличие `OPENAI_API_KEY` или другого AI провайдера
2. Запустите проверку: `npm run voice:verify`
3. Убедитесь, что у вас есть средства на счете API

### Проблемы с базой данных

**Проблема:** `SQLITE_CANTOPEN: unable to open database file`

**Решение:**

```bash
# 1. Удалите старую БД (если нужно)
rm -rf data/

# 2. Переинициализируйте БД
npm run db:init

# 3. Проверьте разрешения на папку data/
ls -la data/
```

### Memory не сохраняется

**Проблема:** Бот не помнит информацию между сеансами

**Решение:**

1. Проверьте `MEM0_API_KEY` и `MEM0_API_BASE`
2. Запустите проверку памяти: `npm run memory:verify`
3. Проверьте логи ошибок

## 📚 Дополнительные ресурсы

- [SETUP.md](SETUP.md) — Подробное руководство по установке
- [.env.example](.env.example) — Пример конфигурационного файла
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 📄 Лицензия

Этот проект распространяется под лицензией **ISC**. См. файл [LICENSE](LICENSE) для деталей.

---

## 🤝 Поддержка

Если у вас возникли проблемы или предложения:

1. 📝 Создайте [Issue](https://github.com/Umalanif/Schedule-bot/issues)
2. 🔧 Предложите улучшение через [Pull Request](https://github.com/Umalanif/Schedule-bot/pulls)
3. 💬 Обсудите на странице [Discussions](https://github.com/Umalanif/Schedule-bot/discussions)

---

**Made with ❤️ by [Umalanif](https://github.com/Umalanif)**

Последнее обновление: May 10, 2026
