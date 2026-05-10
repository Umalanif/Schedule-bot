# 🤝 Руководство по вкладу

Спасибо за интерес к проекту! Это руководство поможет вам внести свой вклад.

## 📋 Содержание

- [Кодекс поведения](#кодекс-поведения)
- [Как начать](#как-начать)
- [Процесс вклада](#процесс-вклада)
- [Стиль кода](#стиль-кода)
- [Коммиты](#коммиты)
- [Pull Requests](#pull-requests)
- [Вопросы и обсуждения](#вопросы-и-обсуждения)

## 📜 Кодекс поведения

Этот проект придерживается следующих принципов:

- ✅ Будьте уважительны и вежливы
- ✅ Помогайте друг другу
- ✅ Принимайте конструктивную критику
- ❌ Не публикуйте оскорбительный контент
- ❌ Не спамьте и не нарушайте конфиденциальность

## 🚀 Как начать

### 1. Fork репозитория

Нажмите кнопку "Fork" на GitHub (верхний правый угол).

### 2. Клонируйте ваш fork

```bash
git clone https://github.com/YOUR_USERNAME/Schedule-bot.git
cd Schedule-bot
```

### 3. Добавьте upstream

```bash
git remote add upstream https://github.com/Umalanif/Schedule-bot.git
```

### 4. Создайте ветку для своего изменения

```bash
git checkout -b feature/my-feature
# или
git checkout -b fix/my-bugfix
```

**Соглашение о названии веток:**

- `feature/description` — новая функция
- `fix/description` — исправление баага
- `docs/description` — документация
- `test/description` — тесты
- `refactor/description` — рефакторинг

### 5. Установите зависимости

```bash
npm install
```

## 📝 Процесс вклада

### Шаг 1: Внесите изменения

Отредактируйте файлы в соответствии с нужными изменениями.

### Шаг 2: Протестируйте свои изменения

```bash
# Собрать TypeScript
npm run build

# Запустить проверки
npm run db:verify-tools
npm run memory:verify

# Запустить бота для ручного тестирования
npm start
```

### Шаг 3: Синхронизируйтесь с upstream

```bash
git fetch upstream
git rebase upstream/main
```

### Шаг 4: Сделайте коммит

```bash
git add .
git commit -m "feat: add new feature"
```

### Шаг 5: Создайте Pull Request

Нажмите "Compare & pull request" на странице вашего fork.

## 🎨 Стиль кода

### TypeScript

Проект использует **strict** TypeScript режим. Пожалуйста:

- ✅ Всегда указывайте типы функций
- ✅ Используйте интерфейсы для структур
- ✅ Избегайте `any` типов
- ✅ Добавляйте JSDoc комментарии

**Пример:**

```typescript
/**
 * Преобразует текст в список задач
 * @param text - Входной текст от пользователя
 * @returns Массив созданных задач
 */
export function parseTasksFromText(text: string): Task[] {
  // Реализация
  return [];
}
```

### Форматирование

- **Indentation:** 2 пробела
- **Line length:** 80 символов рекомендуется, 120 максимум
- **Quotes:** Двойные кавычки `"`
- **Semicolons:** Всегда ставьте точку с запятой

**Хорошо:**

```typescript
export function handleMessage(msg: string): void {
  const normalized = msg.trim().toLowerCase();
  console.log(`Processing: ${normalized}`);
}
```

**Плохо:**

```typescript
export function handleMessage(msg) {
  const normalized = msg.trim().toLowerCase();
  console.log("Processing: " + normalized);
}
```

### Именование

- **Functions:** `camelCase` — `handleUserMessage`
- **Classes:** `PascalCase` — `TelegramBot`
- **Constants:** `UPPER_SNAKE_CASE` — `MAX_RETRIES`
- **Private members:** `_privateField`
- **Booleans:** Начинайте с `is`, `has`, `can` — `isActive`, `hasPermission`

```typescript
// Хорошо
class UserService {
  private _maxRetries = 3;

  public async fetchUser(id: number): Promise<User | null> {
    return this.user;
  }

  public isValid(): boolean {
    return this._maxRetries > 0;
  }
}
```

### Структура файлов

```typescript
// 1. Импорты
import { config } from "../config";
import type { User } from "./types";

// 2. Типы и интерфейсы
export interface UserData {
  id: number;
  name: string;
}

// 3. Константы
const DEFAULT_TIMEOUT = 5000;

// 4. Функции/классы
export class UserHandler {
  // реализация
}

// 5. Экспорты (если нужно)
export default UserHandler;
```

### Обработка ошибок

Всегда обрабатывайте ошибки:

```typescript
// Хорошо
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error("Failed to fetch data:", error);
  throw new Error("Data fetch failed");
}

// Плохо
const result = await fetchData(); // Может не обработаться!
return result;
```

## 💬 Коммиты

Используйте conventional commits формат:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Типы коммитов

- `feat` — новая функция
- `fix` — исправление баога
- `docs` — изменения документации
- `style` — форматирование, без изменения логики
- `refactor` — рефакторинг кода
- `perf` — улучшение производительности
- `test` — добавление тестов
- `chore` — обновление зависимостей, конфигурация

### Примеры коммитов

```bash
# Новая функция
git commit -m "feat(telegram): add voice message support"

# Исправление
git commit -m "fix(memory): prevent duplicate fact storage"

# Документация
git commit -m "docs(setup): add installation guide for Windows"

# Многострочный коммит
git commit -m "refactor(db): optimize task query performance

- Добавил индекс по userId
- Кэширование результатов
- Результат: -50% время запроса" -m "Closes #123"
```

## 📤 Pull Requests

### Перед созданием PR

- ✅ Убедитесь, что код собирается: `npm run build`
- ✅ Протестируйте функцию вручную
- ✅ Синхронизируйтесь с `upstream/main`
- ✅ Нет конфликтов в коде
- ✅ Добавлены комментарии для сложной логики

### Описание PR

```markdown
## Описание

Кратко опишите, что делает этот PR.

## Тип изменения

- [ ] Новая функция
- [ ] Исправление баега
- [ ] Изменение документации
- [ ] Рефакторинг

## Связанные Issues

Closes #123

## Инструкции по тестированию

1. Запустить `npm run build`
2. Запустить `npm start`
3. Отправить боту `/test`

## Чек-лист

- [x] Код собирается без ошибок
- [x] Нет TypeScript ошибок
- [x] Добавлены комментарии к сложному коду
- [x] Обновлена документация (если нужно)
- [x] Протестировано вручную
```

### Во время review

- Будьте готовы к вопросам и предложениям
- Отвечайте конструктивно на критику
- Обновляйте PR на основе feedback
- Нажмите "Re-request review" после обновлений

## 💬 Вопросы и обсуждения

### Как задать вопрос

1. Проверьте [существующие Issues](https://github.com/Umalanif/Schedule-bot/issues)
2. Проверьте [README.md](README.md) и [SETUP.md](SETUP.md)
3. Создайте [новый Issue](https://github.com/Umalanif/Schedule-bot/issues/new)

### Как предложить новую функцию

1. Создайте Issue с меткой `enhancement`
2. Опишите проблему и предлагаемое решение
3. Ожидайте feedback перед начало кодирования

### Как сообщить об ошибке

```markdown
## Описание баега

Краткое описание проблемы

## Шаги воспроизведения

1. Сделал X
2. Ожидал Y
3. Получил Z

## Окружение

- OS: Windows 11
- Node.js: 18.0.0
- npm: 9.0.0

## Логи ошибок
```

Error: ...

```

## Дополнительный контекст
Любая другая полезная информация
```

## 🔗 Полезные ссылки

- [GitHub Issues](https://github.com/Umalanif/Schedule-bot/issues)
- [GitHub Discussions](https://github.com/Umalanif/Schedule-bot/discussions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Спасибо за вашу помощь! 🙏**

Любые вопросы? Создайте [обсуждение](https://github.com/Umalanif/Schedule-bot/discussions) или отправьте мне сообщение.
