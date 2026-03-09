Adventures Of — Next.js app (AI storybooks). See root [README](../../README.md).

## Getting Started

```bash
npm install
cp .env.example .env.local
# Edit .env.local with DATABASE_URL, RAILWAY_BUCKET_*, OPENAI_API_KEY, STRIPE_*, REPLICATE_API_TOKEN
npm run dev
```

Worker (separate terminal): `npm run worker`

## Docs

- [REPLICATE_SETUP.md](docs/REPLICATE_SETUP.md) — image generation
