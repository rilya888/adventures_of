# Как создать Bucket в Railway

Bucket — это хранилище файлов (S3-совместимое). Нужно для загрузки фото детей и сгенерированных изображений.

## Шаг 1. Открыть проект

Перейди: https://railway.com/project/236a4186-dd0a-4903-a80b-fcd922b401b3

## Шаг 2. Создать Bucket

1. Нажми **Create** (или **+** на канвасе)
2. Выбери **Bucket**
3. Выбери регион (например **auto** или **europe-west4**)
4. Имя можно оставить по умолчанию или ввести `assets`
5. Нажми **Create**

## Шаг 3. Подключить к web-сервису

1. Кликни на созданный **Bucket** на канвасе
2. Открой вкладку **Credentials**
3. Нажми **Insert Variables**
4. Выбери **AWS SDK** preset
5. В списке сервисов выбери **web**
6. Нажми **Insert**

Preset добавит переменные в web-сервис. Наш код ожидает имена `RAILWAY_BUCKET_*` — если preset добавит `AWS_*` или `BUCKET`, они тоже подойдут (код проверяет оба варианта).

## Шаг 4. Проверить переменные

Открой **web** → **Variables**. Должны появиться:

- `BUCKET` или `RAILWAY_BUCKET_NAME`
- `ENDPOINT` или `RAILWAY_BUCKET_ENDPOINT`
- `ACCESS_KEY_ID` или `RAILWAY_BUCKET_ACCESS_KEY_ID`
- `SECRET_ACCESS_KEY` или `RAILWAY_BUCKET_SECRET_ACCESS_KEY`

Если preset добавил только `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `ENDPOINT` — этого достаточно, код их подхватит.

## Шаг 5. Redeploy

**web** → **Deployments** → **Redeploy** (или `npm run deploy` из папки `app/`).

---

**Альтернатива (если preset не подходит):** добавь в **web** переменные вручную через **References**:

- `RAILWAY_BUCKET_NAME` = `${{Bucket.BUCKET}}`
- `RAILWAY_BUCKET_ENDPOINT` = `${{Bucket.ENDPOINT}}`
- `RAILWAY_BUCKET_ACCESS_KEY_ID` = `${{Bucket.ACCESS_KEY_ID}}`
- `RAILWAY_BUCKET_SECRET_ACCESS_KEY` = `${{Bucket.SECRET_ACCESS_KEY}}`

(Замени `Bucket` на фактическое имя сервиса Bucket в проекте.)
