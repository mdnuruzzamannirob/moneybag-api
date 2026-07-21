# Expense Tracker API — Implementation Specification

| Document field | Value                                   |
| -------------- | --------------------------------------- |
| Service        | `expense-tracker-api`                   |
| Release        | `1.0.0`                                 |
| Status         | Implemented current-state specification |
| Last verified  | 2026-07-21                              |
| Runtime        | Node.js 24, Express 5, TypeScript 6     |

## 1. Purpose

Expense Tracker API is a multi-user REST service for personal finance
management. It lets an authenticated user record income and expenses, organize
transactions into categories, monitor monthly budgets, track savings goals, and
retrieve analytical reports. It also provides scheduled recurring transactions,
budget-notification email jobs, and a small role-restricted administrative API.

This document describes the behavior present in the repository. It is an
implementation contract, not a future roadmap. Explicit constraints and
unsupported capabilities are listed in section 12.

## 2. Scope and Actors

### 2.1 Actors

| Actor                   | Capabilities                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Anonymous client        | Health/API discovery, registration, login, token refresh, forgot-password, reset-password, Swagger UI   |
| Active user (`USER`)    | Manage their own profile, categories, transactions, budgets, savings goals, and reports                 |
| Administrator (`ADMIN`) | All authenticated-user capabilities plus user listing, activation/deactivation, and platform statistics |
| Scheduler               | Generate recurring transactions and send budget-threshold alerts                                        |

Inactive accounts cannot authenticate or use an existing access token. Admin
authorization is based on the `role` claim after the current database record has
been loaded and checked.

### 2.2 Implemented domains

- Authentication and session lifecycle
- User profile management
- Income and expense categories
- Transactions and CSV bulk import
- Monthly expense budgets
- Savings goals and contributions
- Financial reports and exports
- Administrative user management and statistics
- Recurring-transaction and budget-alert jobs

## 3. Architecture

### 3.1 Technology stack

| Layer                  | Implementation                                         |
| ---------------------- | ------------------------------------------------------ |
| HTTP application       | Express 5                                              |
| Language/module system | TypeScript 6, NodeNext ES modules                      |
| Persistence            | PostgreSQL 18                                          |
| Data access            | Prisma 7 with `@prisma/adapter-pg`                     |
| Cache                  | Redis 8 through ioredis                                |
| Authentication         | JSON Web Tokens and bcrypt password hashing            |
| Input validation       | Zod request schemas                                    |
| Scheduled work         | node-cron in the API process                           |
| Email                  | Nodemailer over optional SMTP                          |
| File generation        | PDFKit and json2csv                                    |
| HTTP hardening         | Helmet, CORS allowlist, rate limiting, CSRF middleware |
| Request logging        | Morgan plus console lifecycle/error logging            |
| Testing                | Jest, ts-jest, and Supertest                           |
| API documentation      | OpenAPI 3, Swagger UI, generated Postman collection    |
| Packaging              | Docker multi-stage build and Docker Compose            |

### 3.2 Application layers

```text
HTTP request
  -> security and parsing middleware
  -> route and Zod validation
  -> controller
  -> domain service
  -> Prisma / Redis / email / file generator
  -> response or centralized error handler
```

Routes, controllers, services, and validation schemas are grouped by domain
under `src/modules`. `src/app.ts` composes the HTTP application, while
`src/server.ts` owns database/cache connections, job registration, the listener,
and graceful shutdown.

### 3.3 Runtime dependencies

PostgreSQL and Redis must both be reachable during bootstrap. Startup connects to
both before opening the HTTP listener. `SIGINT` and `SIGTERM` stop the listener,
disconnect Prisma, and close Redis.

## 4. Functional Requirements

### 4.1 Authentication and sessions

- **AUTH-01 — Registration:** Accept `name`, `email`, `password`, and optional
  three-character `currency`. Email is normalized to lowercase. Passwords must
  contain at least eight characters and are hashed with bcrypt using 12 rounds.
- **AUTH-02 — Registration defaults:** A newly registered user receives five
  categories: Salary, Freelance, Food, Transport, and Bills.
- **AUTH-03 — Login:** Accept normalized email and password, reject missing,
  inactive, or invalid accounts with a generic invalid-credentials response.
- **AUTH-04 — Cookie delivery:** Registration and login return a public user
  object and set HttpOnly access and refresh cookies. Tokens are not returned in
  those response bodies.
- **AUTH-05 — Access authentication:** Protected endpoints accept the access JWT
  from the `accessToken` cookie or an `Authorization: Bearer` header. The cookie
  takes precedence when both are present.
- **AUTH-06 — Refresh rotation:** Refresh accepts a token from the
  `refreshToken` cookie or request body, revokes the stored token, persists a new
  one, and replaces the cookies. Reuse or verification failure invalidates the
  user's stored active refresh tokens.
- **AUTH-07 — Logout:** Logout optionally revokes the supplied refresh token,
  then clears access, refresh, and CSRF cookies.
- **AUTH-08 — Forgot password:** The endpoint always returns the same success
  response. For a known email it creates a cryptographically random token valid
  for one hour and attempts to send a reset message.
- **AUTH-09 — Reset password:** A valid, unused, unexpired reset token can set a
  new password. The reset token is marked used and all active refresh tokens for
  that user are revoked atomically.
- **AUTH-10 — Current user:** The service exposes the canonical
  `/api/users/me` profile endpoint and an authenticated `/api/auth/me` auth
  identity endpoint.

### 4.2 User profile

- **USER-01:** An authenticated user can retrieve `id`, `name`, `email`, `role`,
  `currency`, `isActive`, and `createdAt`.
- **USER-02:** An authenticated user can update `name` and/or `currency`.
- **USER-03:** An authenticated user can change their password after supplying
  the correct current password.
- **USER-04:** Email, role, and active state cannot be changed through the user
  profile routes.

### 4.3 Categories

- **CAT-01:** Categories are owned by a user and have `name`, `type`, optional
  `icon`, and optional `color`.
- **CAT-02:** `type` is either `INCOME` or `EXPENSE`.
- **CAT-03:** Listing supports name search, type filtering, and pagination.
- **CAT-04:** Create, update, and delete operations are limited to the owner.
- **CAT-05:** Deleting a category referenced by a transaction or budget is
  rejected by the database relation constraint.

### 4.4 Transactions

- **TXN-01:** A transaction contains a positive amount, type, owned category,
  date, optional note, tags, optional receipt URL, and optional recurring
  metadata.
- **TXN-02:** The transaction type must match the selected category type.
- **TXN-03:** Listing supports type, category, inclusive date range, exact tag,
  note/tag search, pagination, and sorting by `date`, `amount`, or `createdAt`.
- **TXN-04:** Create, update, and delete operations are owner-scoped.
- **TXN-05:** JSON transaction mutations invalidate all report-cache keys for the
  owner.
- **TXN-06:** CSV import accepts a `multipart/form-data` file no larger than
  1 MiB with MIME type `text/csv` or `application/vnd.ms-excel`.
- **TXN-07:** CSV rows require `amount`, `type`, `categoryId`, and `date`.
  Optional columns are `note`, `tags`, `receiptUrl`, `isRecurring`, and
  `recurringRule`; tags are pipe-delimited.
- **TXN-08:** Recurrence rules accepted by validated JSON requests are `DAILY`,
  `WEEKLY`, and `MONTHLY`. Updating the source transaction's `isRecurring` to
  `false` stops future scheduled copies.

### 4.5 Budgets

- **BUD-01:** A budget defines a positive `limit`, threshold percentage, month,
  year, and owned expense category.
- **BUD-02:** `alertThreshold` is an integer from 1 through 100 and defaults to 80.
- **BUD-03:** Budget listing supports optional month/year filters and pagination.
- **BUD-04:** Budget updates are owner-scoped and may change any create field.
- **BUD-05:** The alerts endpoint evaluates the current calendar month and
  returns only budgets whose expense total meets or exceeds the configured
  threshold.
- **BUD-06:** Each returned alert includes `spent`, `percentUsed`,
  `thresholdCrossed`, and `overBudget`.

### 4.6 Savings goals

- **SAVE-01:** A savings goal requires a title, positive target amount, and ISO
  8601 deadline containing a timezone offset.
- **SAVE-02:** Listing supports title search and pagination, ordered by the
  nearest deadline first.
- **SAVE-03:** Positive contributions atomically increment `currentAmount`.
- **SAVE-04:** Create, list, and contribution responses calculate
  `progressPercent`, capped at 100.
- **SAVE-05:** Delete is owner-scoped.

### 4.7 Reports and exports

- **REP-01:** Monthly and yearly summaries return `totalIncome`, `totalExpense`,
  and `netSavings`.
- **REP-02:** Category breakdown groups expense transactions by category for a
  required month and year.
- **REP-03:** Trend reports aggregate income and expense by UTC date for an
  inclusive `from`/`to` interval. Dates without transactions are omitted.
- **REP-04:** Report queries are cached per user and query in Redis for 300
  seconds.
- **REP-05:** Export produces a monthly summary as either `text/csv` or
  `application/pdf` and sets a download filename.

### 4.8 Administration

- **ADM-01:** All admin endpoints require an authenticated user with role
  `ADMIN`.
- **ADM-02:** User listing supports name/email search, role filter, active-state
  filter, and pagination.
- **ADM-03:** An administrator can activate or deactivate a user.
- **ADM-04:** Platform statistics include total, active, and inactive users;
  transaction count; and the sum of all transaction amounts.

## 5. HTTP API Contract

### 5.1 Service endpoints

| Method | Path        | Access | Purpose                                |
| ------ | ----------- | ------ | -------------------------------------- |
| `GET`  | `/health`   | Public | Service and environment health payload |
| `GET`  | `/api`      | Public | API discovery links                    |
| `GET`  | `/api/docs` | Public | Swagger UI                             |

### 5.2 Authentication and user endpoints

| Method  | Path                        | Access                 | Purpose                                           |
| ------- | --------------------------- | ---------------------- | ------------------------------------------------- |
| `POST`  | `/api/auth/register`        | Public                 | Register and establish a cookie session           |
| `POST`  | `/api/auth/login`           | Public                 | Authenticate and establish a cookie session       |
| `POST`  | `/api/auth/refresh`         | Public                 | Rotate the refresh token and cookies              |
| `POST`  | `/api/auth/logout`          | Public, CSRF-protected | Revoke a supplied refresh token and clear cookies |
| `GET`   | `/api/auth/me`              | User                   | Return current auth identity                      |
| `POST`  | `/api/auth/forgot-password` | Public                 | Start password reset without account disclosure   |
| `POST`  | `/api/auth/reset-password`  | Public                 | Complete password reset with a token              |
| `GET`   | `/api/users/me`             | User                   | Return complete current profile                   |
| `PATCH` | `/api/users/me`             | User                   | Update name and/or currency                       |
| `PATCH` | `/api/users/me/password`    | User                   | Change password using current password            |

### 5.3 Finance endpoints

| Method   | Path                                | Access | Purpose                                     |
| -------- | ----------------------------------- | ------ | ------------------------------------------- |
| `GET`    | `/api/categories`                   | User   | Search/filter/paginate categories           |
| `POST`   | `/api/categories`                   | User   | Create a category                           |
| `PATCH`  | `/api/categories/:id`               | User   | Update an owned category                    |
| `DELETE` | `/api/categories/:id`               | User   | Delete an unreferenced owned category       |
| `GET`    | `/api/transactions`                 | User   | Filter/search/sort/paginate transactions    |
| `POST`   | `/api/transactions`                 | User   | Create a transaction                        |
| `POST`   | `/api/transactions/import`          | User   | Import transaction rows from CSV            |
| `PATCH`  | `/api/transactions/:id`             | User   | Update an owned transaction                 |
| `DELETE` | `/api/transactions/:id`             | User   | Delete an owned transaction                 |
| `GET`    | `/api/budgets`                      | User   | Filter and paginate budgets                 |
| `POST`   | `/api/budgets`                      | User   | Create an expense-category budget           |
| `GET`    | `/api/budgets/alerts`               | User   | Return crossed thresholds for current month |
| `PATCH`  | `/api/budgets/:id`                  | User   | Update an owned budget                      |
| `GET`    | `/api/savings-goals`                | User   | Search and paginate savings goals           |
| `POST`   | `/api/savings-goals`                | User   | Create a savings goal                       |
| `PATCH`  | `/api/savings-goals/:id/contribute` | User   | Add a positive contribution                 |
| `DELETE` | `/api/savings-goals/:id`            | User   | Delete an owned goal                        |

### 5.4 Report and admin endpoints

| Method  | Path                                           | Access | Purpose                             |
| ------- | ---------------------------------------------- | ------ | ----------------------------------- |
| `GET`   | `/api/reports/monthly?month=&year=`            | User   | Monthly financial summary           |
| `GET`   | `/api/reports/yearly?year=`                    | User   | Yearly financial summary            |
| `GET`   | `/api/reports/category-breakdown?month=&year=` | User   | Monthly expense grouping            |
| `GET`   | `/api/reports/trend?from=&to=`                 | User   | Daily income/expense trend          |
| `GET`   | `/api/reports/export?type=&month=&year=`       | User   | Download monthly PDF or CSV summary |
| `GET`   | `/api/admin/users`                             | Admin  | Search/filter/paginate all users    |
| `PATCH` | `/api/admin/users/:id/status`                  | Admin  | Activate or deactivate a user       |
| `GET`   | `/api/admin/stats`                             | Admin  | Return platform-wide aggregates     |

The OpenAPI source is `src/docs/swagger-data.ts`. Generated snapshots are stored
in `docs/openapi.json` and `docs/postman-collection.json`.

## 6. Request and Response Conventions

### 6.1 JSON response envelope

Successful and handled-error JSON responses use:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {},
  "meta": {},
  "errors": []
}
```

Only `success` and `message` are always present. `data`, `meta`, and `errors` are
conditional. Binary PDF and text CSV exports do not use this envelope.

### 6.2 Pagination

Paginated endpoints return their item array as `data` and:

```json
{
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

`page` defaults to 1. `limit` defaults to 20 and cannot exceed 100.

### 6.3 Validation and errors

- Request bodies for JSON mutation endpoints are strict; undeclared fields are
  rejected.
- UUID route parameters use UUID validation.
- Prisma not-found, unique, and relation-constraint errors are mapped to HTTP
  `404`, `409`, and `409` responses respectively.
- Unknown routes return `404` through the centralized error handler.
- Unexpected errors return `500`; stack traces are omitted in production.
- JSON request bodies are limited to 1 MiB.

## 7. Security Requirements

### 7.1 Cookies and tokens

| Cookie         | HttpOnly | Path                | SameSite | Secure          |
| -------------- | -------- | ------------------- | -------- | --------------- |
| `accessToken`  | Yes      | `/`                 | `lax`    | Production only |
| `refreshToken` | Yes      | `/api/auth/refresh` | `lax`    | Production only |
| `XSRF-TOKEN`   | No       | `/`                 | `lax`    | Production only |

An optional `COOKIE_DOMAIN` is applied to all three cookie types. Access and
refresh signing secrets must be different operational secrets of at least 16
characters.

### 7.2 CSRF protection

Every `POST`, `PUT`, `PATCH`, and `DELETE` request must supply an
`X-XSRF-TOKEN` or `CSRF-Token` header equal to the `XSRF-TOKEN` cookie, except:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`

The middleware ensures a CSRF cookie exists on responses. Browser clients must
enable credentialed cross-origin requests.

### 7.3 HTTP controls

- Helmet security headers are enabled globally.
- CORS accepts requests with no browser origin or an exact origin from the
  comma-separated `CORS_ORIGIN` allowlist, with credentials enabled.
- The global rate limit is 200 requests per 15 minutes per client IP.
- Registration, login, forgot-password, and reset-password also use an auth
  limit of 20 requests per 15 minutes.
- The Express proxy trust level is set to one proxy hop.

## 8. Data Model

| Entity               | Principal fields                                                                                    | Relationships and rules                                     |
| -------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `User`               | UUID, name, unique email, password hash, `USER`/`ADMIN`, currency, active flag, created time        | Owns all finance records and tokens                         |
| `Category`           | UUID, name, `INCOME`/`EXPENSE`, icon, color                                                         | Belongs to one user; referenced by transactions and budgets |
| `Transaction`        | UUID, floating-point amount, type, note, date, tags, receipt URL, recurrence metadata, created time | Belongs to one user and category                            |
| `Budget`             | UUID, floating-point limit, threshold, month, year                                                  | Belongs to one user and expense category                    |
| `SavingsGoal`        | UUID, title, floating-point target/current amounts, deadline                                        | Belongs to one user                                         |
| `RefreshToken`       | UUID, unique signed token, expiry, revoked flag                                                     | Belongs to one user                                         |
| `PasswordResetToken` | UUID, unique random token, expiry, used flag                                                        | Belongs to one user; cascades on user deletion              |

Prisma Client is generated into `src/generated/prisma` and excluded from source
control. The committed migration creates PostgreSQL enums for roles and
transaction types. `recurringRule` remains a nullable string at the database
level and is constrained by the HTTP validation layer for JSON requests.

## 9. Caching, Jobs, and Email

### 9.1 Report caching

- Cache keys are scoped by user and report parameters under `reports:<userId>:*`.
- Cache entries expire after 300 seconds.
- Transaction create, update, delete, and each imported row invalidate the
  user's report keys.

### 9.2 Recurring transactions

The scheduler runs at `00:05` each day in the process timezone. It scans source
transactions where `isRecurring=true` and creates a non-recurring copy when:

- `DAILY`: every scheduler run;
- `WEEKLY`: the source date and current date have the same weekday;
- `MONTHLY`: the source date and current date have the same day of month.

### 9.3 Budget alerts

The scheduler runs at `08:00` each day in the process timezone. For every budget
in the current month/year, it sums matching expense transactions. When usage is
at or above `alertThreshold`, it attempts to email the owning user.

### 9.4 Email behavior

SMTP is optional. If host or port is absent, message delivery is skipped and an
informational message is logged. The system attempts to send:

- a welcome message after registration;
- a one-hour password-reset link;
- daily budget-threshold notifications.

Scheduled jobs are not registered when `NODE_ENV=test`.

## 10. Configuration and Deployment

### 10.1 Validated environment

| Variable                                           | Validation/default                                              |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`                                     | Required string                                                 |
| `REDIS_URL`                                        | Defaults to `redis://localhost:6379`                            |
| `JWT_ACCESS_SECRET`                                | Required, minimum 16 characters                                 |
| `JWT_REFRESH_SECRET`                               | Required, minimum 16 characters                                 |
| `JWT_ACCESS_EXPIRES_IN`                            | Defaults to `15m`                                               |
| `JWT_REFRESH_EXPIRES_IN`                           | Defaults to `7d`                                                |
| `CORS_ORIGIN`                                      | Defaults to `http://localhost:3000`                             |
| `PORT`                                             | Positive integer, defaults to 5000                              |
| `NODE_ENV`                                         | `development`, `test`, or `production`; defaults to development |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional strings                                                |
| `SMTP_PORT`                                        | Optional positive integer                                       |

`COOKIE_DOMAIN` is optional and read by the cookie utility without being part of
the Zod environment schema.

### 10.2 Build and container behavior

- `pnpm build` compiles `src` to `dist`.
- The production entry point is `node dist/server.js`.
- The Docker image uses Node.js 24 Alpine and a multi-stage dependency/build/run
  process.
- Docker Compose exposes API 5000, PostgreSQL 5432, and Redis 6379 and persists
  database/cache volumes.
- Database migrations are an explicit deployment step; the API container does
  not apply them automatically.

## 11. Quality Assurance

### 11.1 Automated tests

Unit tests cover JWT and standardized response helpers. Integration suites cover
authentication, users, categories, transactions, budgets, savings goals,
reports/exports, and administration.

Integration tests require isolated PostgreSQL and Redis instances. Their shared
setup truncates every table in the configured PostgreSQL `public` schema and
flushes the configured Redis database before tests. Test configuration must never
target reusable or production data.

### 11.2 CI quality gate

The GitHub Actions workflow runs on pull requests and pushes to `main`. It
provisions PostgreSQL and Redis, installs frozen dependencies, generates Prisma
Client, deploys migrations, and runs:

1. ESLint
2. Application type checking
3. Test type checking
4. Unit and integration tests
5. Production build

No numeric coverage threshold is currently enforced.

### 11.3 API documentation maintenance

`pnpm docs:generate` must be run when the OpenAPI source changes. It refreshes the
committed OpenAPI JSON and Postman collection. Documentation changes should be
reviewed against route definitions, Zod validation, service behavior, Prisma
schema, environment validation, and package scripts.

## 12. Current Constraints and Out-of-Scope Capabilities

The following are intentional statements of the current implementation, not
claims of completed functionality:

- Monetary amounts use PostgreSQL double precision through Prisma `Float`, not a
  fixed-precision decimal type.
- The API stores `receiptUrl` metadata but does not upload receipt images or
  integrate with S3, Cloudinary, or another object store.
- CSV parsing is based on line and comma splitting. Quoted fields containing
  commas and advanced CSV dialects are unsupported.
- CSV row values do not pass through the same Zod schema used by JSON transaction
  requests.
- There is no budget-delete endpoint.
- Savings goals have create, list, contribute, and delete operations but no
  general edit endpoint.
- Background jobs run inside each API process without distributed locks,
  leader election, or idempotency records. A multi-replica deployment must move
  scheduling to a single worker or external scheduler.
- Recurring generation writes directly through Prisma and does not invalidate
  report cache entries.
- Monthly recurrence does not compensate for months lacking the source day, such
  as a rule based on the 31st.
- Budget email alerts have no delivery de-duplication and can be sent on every
  daily run while the threshold remains crossed.
- Redis is mandatory during bootstrap; there is no cache-degraded startup mode.
- `JWT_REFRESH_EXPIRES_IN` controls the JWT and cookie lifetime, while the stored
  refresh-token record currently uses a fixed seven-day expiry.
- Password change does not revoke existing refresh tokens; password reset does.
- Registration/login use cookies for token delivery and do not expose tokens in
  their JSON bodies.
- Jest scripts set `NODE_OPTIONS` with POSIX shell syntax and need the documented
  direct Node invocation when run from Windows PowerShell.
- The repository includes Docker Compose and CI but no cloud-provider deployment
  manifest or infrastructure-as-code.

## 13. Release Acceptance Checklist

A release is documentation-consistent when:

- Prisma Client generation and TypeScript build succeed;
- application and test type checks succeed;
- ESLint succeeds;
- unit and integration suites pass against isolated dependencies;
- committed migrations apply to an empty PostgreSQL database;
- generated OpenAPI and Postman artifacts match their source;
- README setup, environment, command, and endpoint documentation matches the
  implementation;
- production secrets, database data, generated Prisma Client, build output, and
  test coverage artifacts are not committed.
