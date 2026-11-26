# UniVerge Knowledge Platform — Upgraded Edition

A standalone React + Vite + Express + tRPC + Drizzle platform for university readiness.

## Added in this edition
- Independent email/password registration and login.
- Session cookie authentication with protected AI and assessment submission.
- Real assessment runner with question navigation and scoring.
- Adaptive level recommendation based on score.
- Improved knowledge retrieval across title, excerpt, institute and domain.
- Grounded AI answer flow with source references and retrieval-only fallback.
- Network explorer for connected institutions.
- Responsive dashboard and mobile-friendly navigation.
- No required Manus runtime plugin.
- Optional MySQL persistence; demo data works without a database.
- Existing Vitest test suite retained.

## Local setup
```bash
pnpm install
cp .env.example .env
pnpm dev
```
Open http://localhost:3000

## Production
```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

## Database
Set `DATABASE_URL`, then run:
```bash
pnpm db:push
```

If you do not configure a database, the dashboard, assessments, knowledge retrieval and network still work using seeded fallback data. Local accounts are kept in memory unless a database is available.

## AI
Set `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` for LLM synthesis. If unavailable, the protected AI route returns a retrieval-grounded answer instead of failing.
