# Expense Tracker API

A REST API for personal finance management, built with Express 5, TypeScript,
PostgreSQL, Prisma, Redis, and JWT authentication.

The service supports income and expense tracking, category budgets, savings
goals, analytical reports, CSV imports, PDF/CSV exports, scheduled transactions,
email alerts, and role-restricted administration.

For the detailed implementation contract, business rules, and current
limitations, see the [project specification](./expense-tracker-api-project-spec.md).

## Features

- Cookie-based JWT authentication with access and refresh-token rotation
- Optional Bearer access-token authentication for protected endpoints
- CSRF protection for state-changing requests
- Registration, login, logout, profile management, and password reset
- User-owned categories, transactions, budgets, and savings goals
- Transaction filtering, search, sorting, pagination, and CSV import
- Daily, weekly, and monthly recurring-transaction processing
- Monthly and yearly summaries, category breakdowns, and daily trends
- Monthly summary export as PDF or CSV
- Redis-backed report caching with a five-minute TTL
- Budget threshold calculation and scheduled email notifications
- Admin-only user management and platform statistics
- OpenAPI/Swagger UI and a generated Postman collection
- Unit and integration tests plus a GitHub Actions quality gate
- Docker and Docker Compose support

## Technology

| Area              | Technology                           |
| ----------------- | ------------------------------------ |
| Runtime           | Node.js 24, Express 5                |
| Language          | TypeScript 6, ES modules             |
| Database          | PostgreSQL 18                        |
| ORM               | Prisma 7 with the PostgreSQL adapter |
| Cache             | Redis 8 with ioredis                 |
| Authentication    | JWT, bcrypt, HttpOnly cookies        |
| Validation        | Zod                                  |
| Jobs              | node-cron                            |
| API documentation | OpenAPI 3, Swagger UI, Postman       |
| Testing           | Jest, Supertest, ts-jest             |

## Prerequisites

- Node.js 24.x
- pnpm 11.x
- PostgreSQL 18.x
- Redis 8.x
- Docker with Docker Compose, if the infrastructure or complete stack will run
  in containers

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the environment file

On macOS or Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Replace the placeholder secrets and set `DATABASE_URL` and `REDIS_URL` for your
environment. The JWT secrets must each contain at least 16 characters.

To use the PostgreSQL and Redis services from this repository while running the
API on the host, use these local connection values:

```dotenv
DATABASE_URL="postgresql://expense_admin:expense_password@localhost:5432/expense_tracker?schema=public"
REDIS_URL="redis://localhost:6379"
```

Then start the infrastructure:

```bash
docker compose up -d postgres redis
```

### 3. Prepare the database

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

Optionally seed a local administrator and starter categories:

```bash
pnpm prisma:seed
```

The seed account is `admin@etracker.com` with password `Password123!`. It is for
local development only and must not be used in a shared or production system.

### 4. Start the API

```bash
pnpm dev
```

The default URLs are:

- API root: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`
- Swagger UI: `http://localhost:5000/api/docs`

## Run the Complete Stack with Docker

Container-to-container connections must use the Compose service names. Before
starting the stack, configure `.env` with values such as:

```dotenv
DATABASE_URL="postgresql://expense_admin:expense_password@postgres:5432/expense_tracker?schema=public"
REDIS_URL="redis://redis:6379"
```

Build the API, start its dependencies, apply the committed migrations, and then
start the API:

```bash
docker compose build api
docker compose up -d postgres redis
docker compose run --rm api pnpm exec prisma migrate deploy
docker compose up -d api
```

Database migrations are intentionally not run by the API container's startup
command, so they must be applied as a separate deployment step.

## Environment Variables

| Variable                 | Required | Default                                  | Purpose                                               |
| ------------------------ | -------- | ---------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`           | Yes      | None                                     | PostgreSQL connection URL                             |
| `REDIS_URL`              | No       | `redis://localhost:6379`                 | Redis connection URL                                  |
| `JWT_ACCESS_SECRET`      | Yes      | None                                     | Access-token signing secret; minimum 16 characters    |
| `JWT_REFRESH_SECRET`     | Yes      | None                                     | Refresh-token signing secret; minimum 16 characters   |
| `JWT_ACCESS_EXPIRES_IN`  | No       | `15m`                                    | Access-token and access-cookie lifetime               |
| `JWT_REFRESH_EXPIRES_IN` | No       | `7d`                                     | Refresh JWT and refresh-cookie lifetime               |
| `CORS_ORIGIN`            | No       | `http://localhost:3000`                  | Comma-separated browser origin allowlist              |
| `PORT`                   | No       | `5000`                                   | HTTP port                                             |
| `NODE_ENV`               | No       | `development`                            | `development`, `test`, or `production`                |
| `SMTP_HOST`              | No       | None                                     | SMTP server host; email is skipped when unset         |
| `SMTP_PORT`              | No       | None                                     | SMTP server port; port 465 enables a secure transport |
| `SMTP_USER`              | No       | None                                     | Optional SMTP username                                |
| `SMTP_PASS`              | No       | None                                     | Optional SMTP password                                |
| `MAIL_FROM`              | No       | `Expense Tracker <no-reply@example.com>` | Sender identity                                       |
| `COOKIE_DOMAIN`          | No       | Host-only                                | Optional shared domain for authentication cookies     |

`CORS_ORIGIN` is also used as the password-reset frontend URL prefix. When reset
emails are enabled, configure it as a single usable frontend origin.

## Authentication and CSRF

Registration and login return the public user object and set three cookies:

- `accessToken`: HttpOnly access-token cookie
- `refreshToken`: HttpOnly refresh-token cookie scoped to `/api/auth/refresh`
- `XSRF-TOKEN`: readable CSRF token cookie

Browser clients must send credentials with requests. For `POST`, `PUT`, `PATCH`,
and `DELETE` requests, copy the `XSRF-TOKEN` cookie value into an
`X-XSRF-TOKEN` or `CSRF-Token` header. Registration, login, token refresh,
forgot-password, and reset-password are exempt from this CSRF check.

Protected endpoints also accept an access token in the following header:

```http
Authorization: Bearer <access-token>
```

Example registration request:

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"StrongPass123!","currency":"BDT"}' \
  http://localhost:5000/api/auth/register
```

## Response Format

JSON endpoints use a consistent envelope:

```json
{
  "success": true,
  "message": "Transactions fetched",
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
}
```

Validation failures and handled errors return `success: false`, a human-readable
`message`, and, when applicable, an `errors` value. PDF and CSV report exports
return file content directly instead of the JSON envelope.

## API Overview

All business endpoints are prefixed with `/api`. Except for the public auth
operations, they require authentication. Admin routes additionally require the
`ADMIN` role.

| Area          | Endpoints                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service       | `GET /health`, `GET /api`, `GET /api/docs`                                                                                                                                                  |
| Auth          | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Users         | `GET /api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/password`                                                                                                                  |
| Categories    | `GET /api/categories`, `POST /api/categories`, `PATCH /api/categories/:id`, `DELETE /api/categories/:id`                                                                                    |
| Transactions  | `GET /api/transactions`, `POST /api/transactions`, `POST /api/transactions/import`, `PATCH /api/transactions/:id`, `DELETE /api/transactions/:id`                                           |
| Budgets       | `GET /api/budgets`, `POST /api/budgets`, `GET /api/budgets/alerts`, `PATCH /api/budgets/:id`                                                                                                |
| Savings goals | `GET /api/savings-goals`, `POST /api/savings-goals`, `PATCH /api/savings-goals/:id/contribute`, `DELETE /api/savings-goals/:id`                                                             |
| Reports       | `GET /api/reports/monthly`, `GET /api/reports/yearly`, `GET /api/reports/category-breakdown`, `GET /api/reports/trend`, `GET /api/reports/export`                                           |
| Admin         | `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `GET /api/admin/stats`                                                                                                         |

Use Swagger UI for request schemas, query parameters, and response examples. The
generated artifacts are also committed at `docs/openapi.json` and
`docs/postman-collection.json`.

### Pagination and filters

Category, transaction, budget, savings-goal, and admin-user lists are paginated.
The default page size is 20 and the maximum is 100.

Transactions support `type`, `category`, `from`, `to`, `tag`, `search`, `page`,
`limit`, `sortBy`, and `sortOrder`. Dates supplied to `from` and `to` must be ISO
8601 date-time values.

### CSV transaction import

Upload a CSV file as the `file` field of a `multipart/form-data` request to
`POST /api/transactions/import`. The file limit is 1 MiB.

Required columns are `amount`, `type`, `categoryId`, and `date`. Optional columns
are `note`, `tags`, `receiptUrl`, `isRecurring`, and `recurringRule`. Separate
multiple tags with `|`.

```csv
amount,type,categoryId,date,note,tags,isRecurring,recurringRule
250.50,EXPENSE,00000000-0000-0000-0000-000000000001,2026-07-21T09:00:00.000Z,Lunch,food|work,false,
```

The importer uses a basic comma-separated parser and does not support quoted
fields containing commas.

## Background Jobs and Caching

- Recurring transactions run daily at `00:05` in the API process's local time.
  `DAILY`, `WEEKLY`, and `MONTHLY` rules are supported.
- Budget email alerts run daily at `08:00` in the API process's local time and
  evaluate the current month's expense budgets.
- Report results are stored in Redis for 300 seconds. Transaction mutations made
  through the transaction service invalidate the current user's cached reports.
- Scheduled jobs are disabled when `NODE_ENV=test`.

SMTP is optional. Welcome, password-reset, and budget-alert messages are skipped
with an informational log when SMTP is not configured.

## Commands

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `pnpm dev`              | Run the API in watch mode                         |
| `pnpm build`            | Compile TypeScript to `dist/`                     |
| `pnpm start`            | Run the compiled server                           |
| `pnpm lint`             | Lint `src/` and `tests/`                          |
| `pnpm format`           | Format TypeScript files under `src/`              |
| `pnpm typecheck`        | Type-check application code                       |
| `pnpm typecheck:test`   | Type-check test code                              |
| `pnpm test`             | Run unit tests                                    |
| `pnpm test:unit`        | Run unit tests serially                           |
| `pnpm test:integration` | Run integration tests serially                    |
| `pnpm test:coverage`    | Run unit tests with coverage                      |
| `pnpm test:all`         | Run unit and integration tests                    |
| `pnpm prisma:generate`  | Generate Prisma Client in `src/generated/prisma`  |
| `pnpm prisma:migrate`   | Run Prisma's development migration workflow       |
| `pnpm prisma:studio`    | Start Prisma Studio without opening a browser     |
| `pnpm prisma:seed`      | Seed the development administrator and categories |
| `pnpm swagger:generate` | Regenerate `docs/openapi.json`                    |
| `pnpm postman:generate` | Regenerate `docs/postman-collection.json`         |
| `pnpm docs:generate`    | Regenerate both API-documentation artifacts       |

## Testing

Create `.env.test` from `.env.test.example`, then point it to disposable
PostgreSQL and Redis instances. Apply migrations before running integration
tests:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm typecheck:test
pnpm test:all
```

The Jest package scripts use POSIX-style inline environment assignment. From
Windows PowerShell, use the equivalent direct Node invocation:

```powershell
node --experimental-vm-modules .\node_modules\jest\bin\jest.js tests\unit tests\integration --runInBand
```

> **Warning:** Integration-test setup truncates every table in the configured
> PostgreSQL `public` schema and flushes the configured Redis database before
> tests. Never point `.env.test` at development, staging, or production data.

The CI workflow provisions isolated PostgreSQL and Redis services and runs lint,
application and test type checks, all tests, and the production build.

## Project Structure

```text
expense-tracker-api/
|-- prisma/                     # Schema, migrations, and seed script
|-- src/
|   |-- config/                 # Environment, PostgreSQL, and Redis clients
|   |-- docs/                   # OpenAPI source and Swagger setup
|   |-- jobs/                   # Recurring-transaction and budget-alert jobs
|   |-- middlewares/            # Auth, CSRF, validation, rate limits, errors
|   |-- modules/                # Domain routes, controllers, services, schemas
|   |-- scripts/                # OpenAPI and Postman generators
|   |-- types/                  # Express type augmentation
|   |-- utils/                  # Cookies, JWT, email, exports, responses
|   |-- app.ts                  # Express application composition
|   `-- server.ts               # Connections, jobs, listener, shutdown
|-- tests/
|   |-- unit/
|   `-- integration/
|-- docs/                       # Generated OpenAPI and Postman artifacts
|-- Dockerfile
`-- docker-compose.yml
```

## Current Constraints

- Monetary values use database floating-point fields. Use decimal storage before
  relying on this service for accounting-grade precision.
- `receiptUrl` stores an existing URL; the API does not upload receipt files to
  object storage.
- Background jobs run inside the API process and do not use distributed locking.
  A multi-replica deployment needs a single scheduler or external job runner.
- Redis is required during server startup, even though it is used primarily for
  reports.
- The API currently has no budget-delete route or general savings-goal update
  route.
- The packaged Jest commands need a POSIX-compatible shell; use the documented
  direct Node command on Windows.

## License

ISC
