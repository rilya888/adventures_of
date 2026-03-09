# OpenAI Image Generation (gpt-image-1.5)

Провайдер с поддержкой фото: **images.edit** с `input_fidelity: "high"` сохраняет лицо. Без фото — **images.generate** (text-to-image).

См. [OPENAI_IMAGE_EDIT_PLAN.md](OPENAI_IMAGE_EDIT_PLAN.md) для деталей реализации.

## Включение

1. Убедитесь, что `OPENAI_API_KEY` задан (уже используется для текста)
2. Добавить в Railway (worker): `IMAGE_PROVIDER=openai`
3. Redeploy worker

## Поведение

- **С фото** (photoUrls): `images.edit` + `input_fidelity: "high"` — сохраняет лицо ребёнка
- **Без фото**: `images.generate` — иллюстрация без персонализации
- **Размер выхода**: 1024x1536 (портрет для страницы книги)

## Опциональные переменные

| Переменная | Значения | Описание |
|------------|----------|----------|
| `OPENAI_IMAGE_QUALITY` | `low` \| `medium` \| `high` \| `auto` | Качество. По умолчанию: `medium` |

## Сравнение Replicate vs OpenAI

| Критерий | Replicate (InstantID) | OpenAI (images.edit) |
|----------|------------------------|------------------------|
| Сохранение лица | Да | Да (с фото) |
| Вход | URL фото + prompt | File + prompt |
| Без фото | Требует фото | Fallback на generate |
| Стоимость | ~$0.038/изобр. | Зависит от quality |
