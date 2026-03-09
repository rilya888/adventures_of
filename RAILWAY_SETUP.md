# Railway Setup — book-adventures

## Что уже сделано

- ✅ Проект `book-adventures`
- ✅ PostgreSQL (миграции 001, 002 применены)
- ✅ Web-сервис (домен: https://web-production-6f70d.up.railway.app)
- ✅ `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`
- ✅ Stripe (webhook + все переменные)
- ✅ Bucket (ergonomic-icebox) + переменные в web
- ✅ `OPENAI_API_KEY`

## Worker — для фоновой генерации книг

1. [app/docs/WORKER_SETUP.md](docs/WORKER_SETUP.md) — worker уже создан, `START_SCRIPT=worker`
2. Без воркера фоновые задачи (генерация книги) не будут выполняться

## Replicate (InstantID) — для генерации иллюстраций

1. [app/docs/REPLICATE_SETUP.md](docs/REPLICATE_SETUP.md) — `REPLICATE_API_TOKEN` в web + worker
2. Без токена — placeholder-изображения

## CLI

```bash
cd app
npx -y @railway/cli link   # если нужно переподключиться
npm run deploy:all         # деплой web + worker (рекомендуется)
npm run deploy:web         # только web
npm run deploy:worker      # только worker
npx -y @railway/cli logs -s web    # логи web
npx -y @railway/cli logs -s worker # логи worker
npx -y @railway/cli open   # открыть проект
```

> **Важно:** Используй `--no-gitignore`, т.к. корневой `.gitignore` исключает `lib/`. Файл `.railwayignore` в app/ ограничивает, что именно загружается.

## Ссылки

- [Проект](https://railway.com/project/236a4186-dd0a-4903-a80b-fcd922b401b3)
- [Приложение](https://web-production-6f70d.up.railway.app)
