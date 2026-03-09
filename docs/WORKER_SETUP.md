# Background Worker — book-adventures

Фоновые задачи (генерация текста и изображений для книги) обрабатываются воркером на Railway. Внешние сервисы не нужны.

## Запуск

### Локально

```bash
cd app
npm run worker
```

### Railway (2 сервиса)

1. **Web** — уже есть (Next.js)
2. **Worker** — новый сервис в том же проекте (уже создан):
   - **Root Directory:** `app`
   - **Build Command:** `npm run build`
   - **Start Command:** задаётся через `START_SCRIPT=worker` (Railway Variables)
   - **Variables:** те же, что у web (`DATABASE_URL`, `OPENAI_API_KEY`, и т.д.)

Worker опрашивает таблицу `jobs` каждые 3 секунды и обрабатывает jobs со статусом `queued`.

## Проверка

После создания job (preview или approve) воркер подхватит его в течение нескольких секунд. Логи воркера: Railway → worker service → Deployments → View Logs.
