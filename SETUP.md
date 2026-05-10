# 🔧 Подробное руководство по установке и настройке

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Получение API ключей](#получение-api-ключей)
3. [Установка проекта](#установка-проекта)
4. [Конфигурация](#конфигурация)
5. [Инициализация БД](#инициализация-бд)
6. [Запуск бота](#запуск-бота)
7. [Обслуживание](#обслуживание)
8. [Развертывание на сервер](#развертывание-на-сервер)

## 📦 Предварительные требования

Убедитесь, что у вас установлены:

### 1. Node.js и npm

**Windows:**

- Скачайте установщик с [nodejs.org](https://nodejs.org/)
- Выберите LTS версию (рекомендуется 18+)
- Запустите установщик и следуйте инструкциям

**Linux/Mac:**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (с Homebrew)
brew install node
```

Проверьте версию:

```bash
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### 2. Git

**Windows:**

- Скачайте с [git-scm.com](https://git-scm.com/)

**Linux/Mac:**

```bash
# Ubuntu/Debian
sudo apt-get install git

# macOS
brew install git
```

Проверьте:

```bash
git --version
```

### 3. Текстовый редактор (опционально)

Рекомендуется VS Code или WebStorm для удобной разработки.

## 🔑 Получение API ключей

### 1️⃣ Telegram Bot Token

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям (название, username)
4. Скопируйте полученный токен (выглядит как: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

⚠️ **Важно:** Никогда не делитесь этим токеном!

### 2️⃣ Telegram Owner ID

Есть несколько способов узнать ваш ID:

**Способ 1: Через бот GetIDs**

1. Найдите бот [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте ему любое сообщение
3. Он покажет ваш ID (целое число, например: 123456789)

**Способ 2: Через собственный бот**

1. Добавьте временно в код логирование ID отправителя
2. Отправьте боту сообщение
3. Скопируйте ID из логов

### 3️⃣ OpenRouter API Key (Рекомендуется)

OpenRouter — агрегатор AI-моделей, поддерживает множество LLM.

1. Перейдите на [openrouter.ai](https://openrouter.ai/)
2. Нажмите "Sign in" или создайте аккаунт
3. Перейдите в [API keys](https://openrouter.ai/keys)
4. Нажмите "Create key"
5. Скопируйте ключ (выглядит как длинная строка)

**Бесплатный кредит:**

- При регистрации часто дается $5 на тестирование
- Выбирайте дешевые модели для тестирования

**Рекомендуемые модели:**

```
- mistral-7b (дешево и быстро)
- grok-1 (хороший баланс)
- llama-2 (бесплатно через OpenRouter)
```

### 4️⃣ Groq API Key (Быстрое решение)

Groq предоставляет очень быстрые LLM, часто с бесплатным доступом.

1. Перейдите на [groq.com/groqcloud](https://groq.com/groqcloud)
2. Создайте аккаунт
3. Перейдите в Dashboard → API Keys
4. Нажмите "Create API Key"
5. Скопируйте ключ

**Преимущества:**

- Очень быстрый ответ от AI
- Часто бесплатный кредит при регистрации
- Хорошо подходит для быстрого прототипирования

### 5️⃣ OpenAI API Key (Премиум качество)

OpenAI предоставляет самые мощные модели (GPT-4, GPT-3.5).

1. Перейдите на [platform.openai.com](https://platform.openai.com/)
2. Создайте аккаунт и добавьте платежный метод
3. Перейдите в [API keys](https://platform.openai.com/api-keys)
4. Нажмите "Create new secret key"
5. Скопируйте ключ

⚠️ **Важно:** OpenAI требует оплату за использование!

### 6️⃣ Mem0 API Key (Память)

Mem0 обеспечивает долгосрочную память для AI.

1. Перейдите на [mem0.ai](https://mem0.ai/)
2. Нажмите "Sign up"
3. Создайте аккаунт (используйте GitHub или Email)
4. Перейдите в [Dashboard](https://app.mem0.ai/dashboard)
5. В разделе API, нажмите "Create new key"
6. Скопируйте API Key

**Бесплатный план:**

- Включает 100 вызовов API в месяц
- Достаточно для личного использования

## 📥 Установка проекта

### Шаг 1: Клонирование репозитория

```bash
# Перейти в желаемую папку
cd ~/projects  # или любой другой путь

# Клонировать репозиторий
git clone https://github.com/Umalanif/Schedule-bot.git

# Войти в папку проекта
cd Schedule-bot
```

### Шаг 2: Установка зависимостей

```bash
# Установить все зависимости из package.json
npm install

# Проверить установку
npm list --depth=0
```

Вы должны увидеть список зависимостей:

```
├── better-sqlite3
├── dotenv
├── drizzle-orm
├── mem0ai
├── node-cron
└── openai
```

### Шаг 3: Проверка установки TypeScript

```bash
# Проверить версию TypeScript
npx tsc --version

# Проверить конфигурацию
cat tsconfig.json
```

## ⚙️ Конфигурация

### Шаг 1: Создание файла .env

Скопируйте пример файла:

```bash
# На Windows
copy .env.example .env

# На Linux/Mac
cp .env.example .env
```

Если `.env.example` не существует, создайте файл `.env`:

```bash
# На Windows
echo > .env

# На Linux/Mac
touch .env
```

### Шаг 2: Редактирование конфигурации

Откройте файл `.env` в текстовом редакторе и заполните значения:

```env
# ============================================
# ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ
# ============================================

# Telegram Bot Token (получить от @BotFather)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Ваш Telegram ID (целое число, получить от @userinfobot)
TELEGRAM_OWNER_ID=123456789

# ============================================
# ВЫБЕРИТЕ ОДИН AI ПРОВАЙДЕР
# ============================================

# Вариант 1: OpenRouter (РЕКОМЕНДУЕТСЯ)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

# Вариант 2: Groq
# AI_PROVIDER=groq
# GROQ_API_KEY=gsk_YOUR_KEY_HERE

# Вариант 3: OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-YOUR_KEY_HERE

# ============================================
# ПАМЯТЬ (Mem0)
# ============================================

MEM0_API_KEY=YOUR_MEM0_KEY_HERE
MEM0_API_BASE=https://api.mem0.ai/v1

# ============================================
# ОПЦИОНАЛЬНЫЕ ПАРАМЕТРЫ
# ============================================

# Путь к базе данных (по умолчанию: ./data/bot.db)
# DATABASE_PATH=./data/bot.db

# Временная зона (по умолчанию: Europe/Moscow)
# TIMEZONE=Europe/Moscow

# Уровень логирования (debug, info, warn, error)
# LOG_LEVEL=info
```

### Пример конфигурации для каждого провайдера

**Пример 1: OpenRouter (Начинающим рекомендуется)**

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_OWNER_ID=987654321
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-abcdef1234567890abcdef1234567890
MEM0_API_KEY=sk-mem0-abcdef1234567890abcdef1234567890
MEM0_API_BASE=https://api.mem0.ai/v1
```

**Пример 2: Groq (Для быстрого ответа)**

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_OWNER_ID=987654321
AI_PROVIDER=groq
GROQ_API_KEY=gsk_abcdef1234567890abcdef1234567890
MEM0_API_KEY=sk-mem0-abcdef1234567890abcdef1234567890
MEM0_API_BASE=https://api.mem0.ai/v1
```

**Пример 3: OpenAI (Для лучшего качества)**

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_OWNER_ID=987654321
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abcdef1234567890abcdef1234567890
MEM0_API_KEY=sk-mem0-abcdef1234567890abcdef1234567890
MEM0_API_BASE=https://api.mem0.ai/v1
```

### Шаг 3: Проверка конфигурации

```bash
# Проверить, что файл .env создан
ls -la .env

# Убедиться, что все обязательные переменные установлены
cat .env
```

⚠️ **ВАЖНО:** Никогда не коммитьте файл `.env` в Git!

```bash
# Проверить, что .env в .gitignore
grep .env .gitignore
```

## 🗄️ Инициализация БД

### Шаг 1: Сборка проекта

```bash
npm run build
```

Вы должны увидеть:

```
Successfully compiled ...files with TypeScript
```

### Шаг 2: Инициализация базы данных

```bash
npm run db:init
```

Это создаст:

- Папку `data/`
- Файл `data/bot.db` (SQLite база данных)

Проверьте успешность:

```bash
ls -la data/
```

### Шаг 3: Проверка инструментов БД

```bash
npm run db:verify-tools
```

Должен вывести список доступных инструментов:

```
✓ add_task
✓ get_today_schedule
✓ update_task_status
✓ ...
```

### Шаг 4: Проверка памяти

```bash
npm run memory:verify
```

Должен подтвердить подключение к Mem0:

```
✓ Memory client initialized successfully
```

## 🚀 Запуск бота

### Первый запуск

```bash
npm start
```

Вы должны увидеть в консоли:

```
Bot started successfully
Listening for messages...
```

### Тестирование бота

1. Откройте Telegram
2. Найдите вашего бота (используя @username)
3. Отправьте сообщение `/start`
4. Проверьте ответ

### Запуск в фоне (Linux/Mac)

**Вариант 1: nohup (простой)**

```bash
nohup npm start > logs/bot.log 2>&1 &

# Проверить статус
ps aux | grep "npm start"

# Остановить
killall node
```

**Вариант 2: PM2 (профессиональный)**

```bash
# Установить PM2 глобально
npm install -g pm2

# Запустить с PM2
pm2 start npm --name "schedule-bot" -- start

# Проверить статус
pm2 status

# Просмотр логов
pm2 logs schedule-bot

# Остановить
pm2 stop schedule-bot

# Удалить
pm2 delete schedule-bot
```

**Вариант 3: Docker (рекомендуется для сервера)**

```bash
# Создать Dockerfile (см. раздел Docker ниже)
docker build -t schedule-bot .
docker run -d --name schedule-bot schedule-bot
```

## 🛠️ Обслуживание

### Регулярные проверки

```bash
# Проверить состояние памяти
npm run memory:verify

# Очистить тестовую память (если нужно)
npm run memory:clean-test

# Проверить голосовую функцию
npm run voice:verify

# Проверить текстовое расписание
npm run telegram:verify-text-schedule
```

### Обновление зависимостей

```bash
# Проверить устаревшие пакеты
npm outdated

# Обновить все пакеты
npm update

# Обновить конкретный пакет
npm install package-name@latest
```

### Очистка

```bash
# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install

# Удалить скомпилированный код
rm -rf dist/

# Пересобрать
npm run build
```

## 🌐 Развертывание на сервер

### Вариант 1: Развертывание на VPS (Linux)

**1. Подключение к серверу:**

```bash
ssh user@your-server.com
```

**2. Установка Node.js:**

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**3. Клонирование проекта:**

```bash
cd /opt/
sudo git clone https://github.com/Umalanif/Schedule-bot.git
cd Schedule-bot
```

**4. Установка зависимостей:**

```bash
npm install --production
npm run build
```

**5. Создание .env:**

```bash
sudo nano .env
# Вставить конфигурацию
```

**6. Инициализация БД:**

```bash
npm run db:init
```

**7. Установка PM2:**

```bash
sudo npm install -g pm2
```

**8. Запуск с PM2:**

```bash
pm2 start npm --name "schedule-bot" -- start
pm2 startup
pm2 save
```

### Вариант 2: Docker

**Создайте Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
```

**Создайте .dockerignore:**

```
node_modules
dist
data
.env
.git
```

**Запустите:**

```bash
docker build -t schedule-bot .
docker run -d \
  --name schedule-bot \
  --env-file .env \
  -v schedule-bot-data:/app/data \
  schedule-bot
```

### Вариант 3: Railway/Heroku/Render

Эти платформы поддерживают автоматическое развертывание из GitHub:

1. Свяжите GitHub репозиторий
2. Установите переменные окружения в dashboard
3. Платформа автоматически выполнит `npm install` и `npm start`

## 🔍 Отладка

### Проверка логов

```bash
# Увидеть текущие логи
npm start

# Или с PM2
pm2 logs schedule-bot

# Или в Docker
docker logs schedule-bot
```

### Включение debug режима

Отредактируйте `src/index.ts` и добавьте:

```typescript
process.env.DEBUG = "*";
```

### Проверка подключения

```bash
# Проверить интернет
ping google.com

# Проверить подключение к Telegram
curl https://api.telegram.org/bot{TOKEN}/getMe

# Проверить подключение к API провайдера
curl https://api.openrouter.ai/api/v1/models
```

---

**Готово! Ваш бот должен быть запущен и работать. 🎉**

Если возникли проблемы, см. раздел "Решение проблем" в [README.md](README.md).
