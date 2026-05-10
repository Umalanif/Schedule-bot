#!/usr/bin/env pwsh
# Скрипт для автоматической отправки всех файлов на GitHub

Write-Host "🚀 Начинаем отправку проекта на GitHub..." -ForegroundColor Green
Write-Host ""

# 1. Инициализация Git (если нужно)
Write-Host "1️⃣  Инициализирую Git репозиторий..." -ForegroundColor Cyan
if (-not (Test-Path .\.git)) {
    git init
    Write-Host "✅ Git инициализирован" -ForegroundColor Green
} else {
    Write-Host "✅ Git уже инициализирован" -ForegroundColor Green
}

Write-Host ""

# 2. Добавляем все файлы
Write-Host "2️⃣  Добавляю все файлы..." -ForegroundColor Cyan
git add .
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Файлы добавлены" -ForegroundColor Green
    Write-Host ""
    Write-Host "Новые файлы:" -ForegroundColor Yellow
    git status --short
} else {
    Write-Host "ℹ️  Нет новых файлов для добавления" -ForegroundColor Yellow
}

Write-Host ""

# 3. Создаем начальный коммит
Write-Host "3️⃣  Создаю начальный коммит..." -ForegroundColor Cyan
$commitMessage = @"
docs: add comprehensive documentation and setup guides

- Add detailed README with all features and quick start
- Add step-by-step SETUP.md installation guide
- Add ARCHITECTURE.md with project structure and diagrams
- Add CONTRIBUTING.md for developers with code style guidelines
- Add SECURITY.md with best practices and vulnerability policy
- Add CHANGELOG.md with version history
- Add GitHub issue templates (bug, feature, documentation)
- Add GitHub pull request template with checklist
- Add GitHub Actions CI/CD workflow for automated testing
- Update package.json with keywords and repository metadata
- Add .env.example with all configuration options
- Add docs/README.md with welcome page for contributors
"@

git commit -m $commitMessage
Write-Host "✅ Коммит создан" -ForegroundColor Green

Write-Host ""

# 4. Переименовываем ветку в main (если нужно)
Write-Host "4️⃣  Проверяю основную ветку..." -ForegroundColor Cyan
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    Write-Host "⚠️  Текущая ветка: $branch"
    Write-Host "📝 Переименовываю в main..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✅ Ветка переименована в main" -ForegroundColor Green
} else {
    Write-Host "✅ Уже на ветке main" -ForegroundColor Green
}

Write-Host ""

# 5. Добавляем remote
Write-Host "5️⃣  Проверяю remote..." -ForegroundColor Cyan
$remoteExists = git remote | Select-String origin
if ($remoteExists) {
    Write-Host "✅ Remote 'origin' уже настроен:" -ForegroundColor Green
    git remote -v
} else {
    Write-Host "⚠️  Remote 'origin' не настроен"
    Write-Host "❓ Введите URL вашего GitHub репозитория:" -ForegroundColor Yellow
    Write-Host "   Например: https://github.com/Umalanif/Schedule-bot.git"
    $gitUrl = Read-Host "   URL"
    
    if ($gitUrl) {
        git remote add origin $gitUrl
        Write-Host "✅ Remote добавлен:" -ForegroundColor Green
        git remote -v
    } else {
        Write-Host "❌ URL не введен. Пожалуйста, добавьте remote вручную:" -ForegroundColor Red
        Write-Host "   git remote add origin <URL>"
        exit 1
    }
}

Write-Host ""

# 6. Отправляем на GitHub
Write-Host "6️⃣  Отправляю код на GitHub..." -ForegroundColor Cyan
Write-Host "⏳ Это может занять время..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Код успешно отправлен!" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при отправке на GitHub" -ForegroundColor Red
    Write-Host "   Проверьте подключение и попробуйте еще раз:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 УСПЕШНО ОТПРАВЛЕНО НА GITHUB!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Откройте https://github.com/Umalanif/Schedule-bot"
Write-Host "2. Перейдите в Settings (Параметры)"
Write-Host "3. Добавьте Description: 'Personal Telegram AI assistant...'"
Write-Host "4. Добавьте Topics: telegram, bot, ai, assistant, typescript"
Write-Host "5. Включите GitHub Actions"
Write-Host ""

Write-Host "📚 Документация:" -ForegroundColor Cyan
Write-Host "- README.md - Основная документация"
Write-Host "- SETUP.md - Инструкция по установке"
Write-Host "- CONTRIBUTING.md - Для разработчиков"
Write-Host "- GITHUB_PUSH_GUIDE.md - Полная инструкция"
Write-Host ""

Write-Host "✅ Все готово!" -ForegroundColor Green
