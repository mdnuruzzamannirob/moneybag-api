# Expense Tracker API

Production-style REST API for personal finance management built with Express,
TypeScript, PostgreSQL, Prisma, Redis, JWT, Swagger, Docker, and CI.

## What’s Included

- JWT auth with access and refresh token rotation
- Register, login, logout, forgot password, and password reset
- User profile and password management
- Category CRUD
- Transaction CRUD with filtering, pagination, sorting, and CSV import
- Budget CRUD and budget alerts
- Savings goals with contribution tracking
- Reports for monthly, yearly, category breakdown, and trend data
- PDF and CSV report export
- Admin user listing, status updates, and platform stats
- Cron jobs for recurring transactions and budget alerts
- Redis caching for report queries
- Swagger docs at `/api/docs`
- Docker Compose and GitHub Actions CI

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

The API starts on `http://localhost:5000` by default.

## CLI Commands

```bash
pnpm dev              # run in watch mode
pnpm build            # compile TypeScript
pnpm start            # run the compiled server
pnpm run lint         # lint src
pnpm test             # run Jest with coverage
pnpm prisma:generate  # refresh Prisma Client after schema changes
pnpm prisma:migrate   # apply database migrations
pnpm prisma:studio    # inspect the database in Prisma Studio without auto-opening a browser
pnpm prisma:seed      # seed starter data
pnpm swagger:generate # write docs/openapi.json from the source spec
pnpm postman:generate # write docs/postman-collection.json from the source spec
pnpm docs:generate    # refresh both Swagger and Postman outputs
```

## API Surface

Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/password`

Categories

- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`

Transactions

- `GET /api/transactions`
- `POST /api/transactions`
- `POST /api/transactions/import`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`

Budgets

- `POST /api/budgets`
- `GET /api/budgets`
- `GET /api/budgets/alerts`
- `PATCH /api/budgets/:id`

Savings Goals

- `POST /api/savings-goals`
- `GET /api/savings-goals`
- `PATCH /api/savings-goals/:id/contribute`
- `DELETE /api/savings-goals/:id`

Reports

- `GET /api/reports/monthly`
- `GET /api/reports/yearly`
- `GET /api/reports/category-breakdown`
- `GET /api/reports/trend`
- `GET /api/reports/export`

Admin

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/stats`

## Docker

```bash
docker compose up --build
```

Services:

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Environment

The app validates environment variables at startup and exits fast if any required
value is missing or invalid. See `.env.example` for the full list.

For tests, copy `.env.test.example` to `.env.test` and adjust the test database
and Redis values for your local machine or CI environment.

## Notes

- Prisma Client is generated into `src/generated/prisma`.
- Password reset tokens are persisted in the database and expire after one hour.
- Report responses are cached in Redis and invalidated on transaction changes.
- Swagger docs are generated from `src/docs/swagger-data.ts`; run `pnpm docs:generate` to refresh `docs/openapi.json` and `docs/postman-collection.json`.
