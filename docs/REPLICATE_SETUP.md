# Replicate Image Generation (Spike 23)

Опциональная интеграция Replicate PhotoMaker для генерации иллюстраций. Без токена — placeholder.

## IMAGE_PROVIDER

Выбор провайдера через переменную `IMAGE_PROVIDER`:

- `replicate` — PhotoMaker, сохраняет лицо ребёнка (нужен `REPLICATE_API_TOKEN`)
- `openai` — gpt-image-1.5, text-to-image без лица (нужен `OPENAI_API_KEY`)

По умолчанию: replicate при наличии `REPLICATE_API_TOKEN`, иначе openai при наличии `OPENAI_API_KEY`.

См. [OPENAI_IMAGE_SETUP.md](OPENAI_IMAGE_SETUP.md) для сравнения и настройки OpenAI.

## Включение Replicate

1. [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) → создать токен
2. Добавить в Railway (web + worker): `REPLICATE_API_TOKEN=r8_xxx`
3. Опционально: `IMAGE_PROVIDER=replicate` (если хотите явно)
4. Redeploy обоих сервисов

## Модель

- **bytedance/flux-pulid** — FLUX PuLID (2/6). Identity preservation, start_step 1 for stylized.
- Вход: `input_image` (фото ребёнка, pre-signed URL) + prompt с триггером `img`
- Опционально: `input_image2`–`input_image4` — дополнительные фото для лучшего сходства
- Выход: загружается в Railway Bucket, возвращается наш URL

## Промпты и параметры

### FlashFace

Промпт описывает только сцену и стиль, НЕ внешность персонажа (без волос, бороды, возраста). Лицо берётся из референса.

### REPLICATE_PROMPT_VERSION

- `v1` — консервативный промпт
- `v2` — расширенный (painterly, style tokens)
- По умолчанию: `v2`

### A/B тестирование (REPLICATE_PROMPT_AB_RATIO)

- `0.5` — 50% v1, 50% v2 (детерминировано по jobId)
- `0.3` — 30% v1, 70% v2
- Не задано — используется REPLICATE_PROMPT_VERSION

### negative_prompt

Фильтрует нежелательные артефакты. Переопределение: `REPLICATE_NEGATIVE_PROMPT_OVERRIDE` (env).

### Likeness (опционально)

- `REPLICATE_FACE_GUIDANCE` — 1–5, по умолчанию 3. Выше = сильнее сохранение лица (лысина, борода и т.д.).

### Soft fallback

При 400/422 от Replicate — повторный вызов с минимальным input (`input_image`, `prompt`). В логах: `attempt=primary|fallback`.

### Telemetry

Структурированные логи (без prompt/PII): `prompt_version`, `attempt`, `status`, `latency_ms`, `content_type`.
