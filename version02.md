# MoneyBag – Personal Finance Manager

## Complete Project Specification v2.0

### 1. Executive Summary

MoneyBag is a subscription‑based, multi‑tenant web application for personal finance tracking. Users can manage income, expenses, budgets, and savings goals, and generate rich reports. The platform includes an integrated administration panel for user management, subscription oversight, and platform analytics. The system is built with a modern, scalable architecture and follows industry best practices for security, performance, and developer experience.

---

### 2. Product Features

#### 2.1 User Capabilities

- **Authentication** – email/password and OAuth 2.0 (Google). Ready for two‑factor authentication.
- **Dashboard** – real‑time monthly financial summary, upcoming recurring transactions, budget progress, savings snapshots, and quick‑action shortcuts.
- **Categories** – CRUD for income/expense categories with custom icons and colours.
- **Transactions** – full lifecycle: create, edit, delete, filter (type, category, date, tags), search, paginate, sort.
  - Bulk CSV import with validation.
  - Recurring transaction automation (daily, weekly, monthly).
- **Budgets** – monthly / yearly limits, roll‑over option, threshold alerts (in‑app and email).
- **Savings Goals** – deadline‑based target tracking with contribution logs.
- **Reports** – interactive charts (monthly summary, category breakdown, income‑expense trend), export to PDF/CSV.
- **Family Sharing** (Pro) – invite up to 5 members, assign roles (viewer/editor), view aggregated reports.
- **Receipt Upload** – attach images to transactions, stored securely in the cloud.
- **Settings** – profile, currency, theme (light/dark/system), notification preferences, data export (JSON/CSV), account deletion.
- **Subscription** – plan upgrade/downgrade, billing history, invoices, 14‑day free trial (no credit card required).

#### 2.2 Admin Capabilities

- **Dashboard** – platform KPIs: total users, active trials, MRR, subscriptions by plan, new registrations.
- **User Management** – search, filter, view detailed profile, activate/deactivate, impersonate, manually assign plan.
- **Subscription Management** – list all subscriptions, filter by status/plan, issue refunds, cancel/reactivate.
- **Plan Configuration** – define Free, Pro Monthly, Pro Yearly, and Unlimited plans with custom limits and pricing.
- **System Categories** – manage default categories available to new users.
- **Audit Logs** – track all critical admin actions and significant user events.
- **Email Templates** – edit transactional email content (welcome, password reset, budget alert, subscription expiry).
- **Platform Settings** – global currency list, SMTP configuration, maintenance mode toggle, file‑upload size limits.

#### 2.3 Subscription Model

| Plan            | Price         | Limits / Features                                                                                                                              |
|-----------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| **Free**        | $0            | 50 transactions/month, 2 budgets, 1 savings goal, basic reports, no CSV import, no receipt upload, no family sharing, limited storage.      |
| **Pro Monthly** | $4.99/month   | Unlimited transactions, budgets, goals, full reports, CSV import, receipt upload, family sharing (up to 5 members), priority support.        |
| **Pro Yearly**  | $49.99/year   | Same features as Pro Monthly, billed annually at a discounted rate (~$4.17/month).                                                            |
| **Unlimited**   | $99.99/lifetime | All Pro features permanently, no recurring payment. Includes all future Pro upgrades.                                                        |

- Free trial: 14 days of Pro Monthly for new users, auto‑converts to Free unless a plan is selected. No credit card required for trial.
- Payment: Stripe Checkout, webhook‑based subscription sync. Unlimited is a one‑time payment (lifetime) with no expiration.

---

### 3. Technology Stack (Version‑free)

| Layer                | Technology                                           |
|----------------------|------------------------------------------------------|
| **Backend Runtime**  | Node.js                                              |
| **Framework**        | Express with TypeScript (strict mode)                |
| **Database**         | PostgreSQL                                           |
| **ORM**              | Prisma                                               |
| **Cache**            | Redis                                                |
| **Authentication**   | JWT (access + refresh tokens), bcrypt                |
| **Validation**       | Zod                                                  |
| **File Upload**      | Cloudinary (server‑side or signed presets)           |
| **Payments**         | Stripe SDK + webhooks                                |
| **Email**            | Nodemailer (SMTP) + Handlebars templates             |
| **Job Scheduling**   | node‑cron                                            |
| **API Documentation**| OpenAPI 3.1 (Swagger UI)                             |
| **Containerization** | Docker + Docker Compose                              |
| **Testing**          | Vitest, Supertest, Testcontainers                    |
| **CI/CD**            | GitHub Actions                                       |
| **Frontend Framework** | Next.js (App Router)                                |
| **Styling**          | Tailwind CSS, shadcn/ui                              |
| **State Management** | Redux Toolkit Query (RTK Query)                      |
| **Charts**           | Apache ECharts                                       |
| **HTTP Client**      | Axios (interceptors for CSRF & token refresh)        |
| **Notifications**    | Sonner (toast)                                       |
| **Date Handling**    | date‑fns                                             |

---

### 4. Database Schema (Prisma Representation)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum TxnType {
  INCOME
  EXPENSE
}

enum RecurringRule {
  DAILY
  WEEKLY
  MONTHLY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  INCOMPLETE
  LIFETIME
}

model User {
  id                String    @id @default(uuid()) @db.Uuid
  name              String
  email             String    @unique
  passwordHash      String?
  avatarUrl         String?
  currency          String    @default("USD")
  theme             String    @default("system")
  role              Role      @default(USER)
  isActive          Boolean   @default(true)
  trialEndsAt       DateTime?
  stripeCustomerId  String?   @unique
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now()) @db.Timestamptz
  updatedAt         DateTime  @updatedAt @db.Timestamptz

  categories        Category[]
  transactions      Transaction[]
  budgets           Budget[]
  savingsGoals      SavingsGoal[]
  refreshTokens     RefreshToken[]
  passwordResets    PasswordResetToken[]
  subscription      Subscription?
  ownedFamilyGroups FamilyGroup[]
  familyMemberships FamilyMember[]
  auditLogs         AuditLog[]
}

model Subscription {
  id                  String               @id @default(uuid()) @db.Uuid
  userId              String               @unique @db.Uuid
  user                User                 @relation(fields: [userId], references: [id])
  planId              String               @db.Uuid
  plan                Plan                 @relation(fields: [planId], references: [id])
  stripeSubscriptionId String?             @unique
  status              SubscriptionStatus   @default(TRIALING)
  currentPeriodStart  DateTime             @db.Timestamptz
  currentPeriodEnd    DateTime?            @db.Timestamptz   // null for lifetime
  cancelAtPeriodEnd   Boolean              @default(false)
  createdAt           DateTime             @default(now()) @db.Timestamptz
}

model Plan {
  id            String         @id @default(uuid()) @db.Uuid
  name          String
  slug          String         @unique
  description   String?
  price         Decimal        @db.Decimal(10,2)
  interval      String         // "monthly", "yearly", "lifetime"
  limits        Json
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now()) @db.Timestamptz
  subscriptions Subscription[]
}

model Category {
  id           String        @id @default(uuid()) @db.Uuid
  userId       String?       @db.Uuid
  user         User?         @relation(fields: [userId], references: [id])
  name         String
  type         TxnType
  icon         String?
  color        String?
  transactions Transaction[]
  budgets      Budget[]
}

model Transaction {
  id            String        @id @default(uuid()) @db.Uuid
  userId        String        @db.Uuid
  user          User          @relation(fields: [userId], references: [id])
  categoryId    String        @db.Uuid
  category      Category      @relation(fields: [categoryId], references: [id])
  amount        Decimal       @db.Decimal(12,2)
  type          TxnType
  date          DateTime      @db.Date
  note          String?       @db.VarChar(500)
  tags          String[]      @default([])
  receiptUrl    String?
  isRecurring   Boolean       @default(false)
  recurringRule RecurringRule?
  createdAt     DateTime      @default(now()) @db.Timestamptz
  updatedAt     DateTime      @updatedAt @db.Timestamptz
}

model Budget {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  user           User     @relation(fields: [userId], references: [id])
  categoryId     String?  @db.Uuid
  category       Category? @relation(fields: [categoryId], references: [id])
  limit          Decimal  @db.Decimal(12,2)
  alertThreshold Int      @default(80)
  month          Int
  year           Int
  rollover       Boolean  @default(false)
  createdAt      DateTime @default(now()) @db.Timestamptz
  updatedAt      DateTime @updatedAt @db.Timestamptz
}

model SavingsGoal {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  user          User     @relation(fields: [userId], references: [id])
  title         String
  targetAmount  Decimal  @db.Decimal(12,2)
  currentAmount Decimal  @default(0) @db.Decimal(12,2)
  deadline      DateTime @db.Date
  createdAt     DateTime @default(now()) @db.Timestamptz
  contributions SavingsContribution[]
}

model SavingsContribution {
  id     String   @id @default(uuid()) @db.Uuid
  goalId String   @db.Uuid
  goal   SavingsGoal @relation(fields: [goalId], references: [id])
  amount Decimal  @db.Decimal(12,2)
  date   DateTime @db.Date
  note   String?
}

model FamilyGroup {
  id      String         @id @default(uuid()) @db.Uuid
  ownerId String         @db.Uuid
  owner   User           @relation(fields: [ownerId], references: [id])
  name    String
  members FamilyMember[]
}

model FamilyMember {
  id      String     @id @default(uuid()) @db.Uuid
  groupId String     @db.Uuid
  group   FamilyGroup @relation(fields: [groupId], references: [id])
  userId  String     @db.Uuid
  user    User       @relation(fields: [userId], references: [id])
  role    String     @default("viewer")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  token     String   @unique
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime @db.Timestamptz
  revoked   Boolean  @default(false)
}

model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  token     String   @unique
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime @db.Timestamptz
  used      Boolean  @default(false)
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @db.Uuid
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  details   Json?
  createdAt DateTime @default(now()) @db.Timestamptz
}

model EmailTemplate {
  id      String   @id @default(uuid()) @db.Uuid
  name    String   @unique
  subject String
  body    String   @db.Text
}

model GlobalSetting {
  key   String @id
  value Json
}
```

**Key schema decisions:**

- `Decimal` for all monetary columns to avoid floating‑point inaccuracies.
- `RefreshToken` table supports **single‑use policy**: each token is revoked after a successful rotation.
- `Subscription` has a `LIFETIME` status for the Unlimited plan.
- `Plan.limits` is a JSON field that stores per‑plan capabilities (e.g., `{"maxTransactions":50, "csvImport":false}`).

---

### 5. API Design

All business endpoints are under `/api`. Authentication is handled via **HttpOnly cookies** (or `Authorization: Bearer` header). State‑changing requests require a CSRF token, except for public auth endpoints.

**Refresh token behaviour:** each refresh token is **single‑use**. Upon successful token rotation, the used token is marked `revoked` and a new token is issued. Concurrent refresh attempts for the same user are prevented at the application level to avoid race conditions.

#### 5.1 Authentication & Users

| Method | Path                     | Auth   | Description |
|--------|--------------------------|--------|-------------|
| POST   | /auth/register           | Public | Register, start trial, set cookies |
| POST   | /auth/login              | Public | Login, set cookies |
| POST   | /auth/refresh            | Public | Rotate token (single‑use), set new cookies |
| POST   | /auth/logout             | Public | Revoke refresh token, clear cookies |
| POST   | /auth/forgot-password    | Public | Send reset email if account exists |
| POST   | /auth/reset-password     | Public | Reset password with valid token |
| GET    | /users/me                | User   | Current user profile |
| PATCH  | /users/me                | User   | Update name, currency, theme, avatar |
| PATCH  | /users/me/password       | User   | Change password |

#### 5.2 Categories

| Method | Path                  | Auth | Description |
|--------|-----------------------|------|-------------|
| GET    | /categories           | User | List user‑owned and system default categories (paginated, filterable by type) |
| POST   | /categories           | User | Create personal category |
| PATCH  | /categories/:id       | User | Update owned category |
| DELETE | /categories/:id       | User | Delete owned category (blocked if referenced) |

#### 5.3 Transactions

| Method | Path                      | Auth | Description |
|--------|---------------------------|------|-------------|
| GET    | /transactions             | User | Filter, search, paginate, sort (type, category, date range, tags, search text) |
| POST   | /transactions             | User | Create transaction (enforces plan limits) |
| POST   | /transactions/import      | User | CSV bulk import (multipart form, 1 MB max) |
| PATCH  | /transactions/:id         | User | Update transaction |
| DELETE | /transactions/:id         | User | Delete transaction |
| POST   | /transactions/:id/receipt | User | Upload receipt image (Cloudinary, multipart, 5 MB max) |

#### 5.4 Budgets

| Method | Path                 | Auth | Description |
|--------|----------------------|------|-------------|
| GET    | /budgets             | User | List budgets (filter by month/year) |
| POST   | /budgets             | User | Create budget (category optional for overall) |
| GET    | /budgets/alerts      | User | Get budgets exceeding threshold for current month (includes spent, percentage) |
| PATCH  | /budgets/:id         | User | Update budget |
| DELETE | /budgets/:id         | User | Delete budget |

#### 5.5 Savings Goals

| Method | Path                          | Auth | Description |
|--------|-------------------------------|------|-------------|
| GET    | /savings-goals                | User | List goals (search by title) |
| POST   | /savings-goals                | User | Create goal |
| PATCH  | /savings-goals/:id/contribute | User | Add contribution |
| DELETE | /savings-goals/:id            | User | Delete goal |

#### 5.6 Reports

| Method | Path                          | Auth | Description |
|--------|-------------------------------|------|-------------|
| GET    | /reports/monthly              | User | Monthly summary (income, expense, net) |
| GET    | /reports/yearly               | User | Yearly summary |
| GET    | /reports/category-breakdown   | User | Expense per category for a given month |
| GET    | /reports/trend                | User | Daily income/expense for a date range |
| GET    | /reports/export               | User | Export monthly summary as PDF or CSV |

#### 5.7 Family (Pro features only)

| Method | Path                               | Auth | Description |
|--------|------------------------------------|------|-------------|
| GET    | /family/groups                     | User | List groups owned or joined |
| POST   | /family/groups                     | User | Create group |
| POST   | /family/groups/:id/invite          | User | Invite member by email |
| DELETE | /family/groups/:id/members/:userId | User | Remove member |
| GET    | /family/groups/:id/transactions    | User | Aggregated transactions for group |

#### 5.8 Billing & Subscription

| Method | Path                     | Auth   | Description |
|--------|--------------------------|--------|-------------|
| GET    | /billing/plans           | User   | List available plans (Free, Pro Monthly, Pro Yearly, Unlimited) |
| GET    | /billing/subscription    | User   | Current user subscription details |
| POST   | /billing/checkout        | User   | Create Stripe Checkout session for subscription |
| POST   | /billing/portal          | User   | Returns Stripe Customer Portal URL |
| POST   | /billing/webhook         | Public | Stripe webhook handler (signature verified) |

#### 5.9 Admin Endpoints (ADMIN role required)

| Method | Path                              | Description |
|--------|-----------------------------------|-------------|
| GET    | /admin/stats                      | Platform KPIs (users, subscriptions, MRR, active today) |
| GET    | /admin/users                      | List/search users (email, status, role, plan) |
| PATCH  | /admin/users/:id/status           | Activate/deactivate user |
| POST   | /admin/users/:id/impersonate      | Obtain impersonation token |
| PATCH  | /admin/users/:id/plan             | Manually assign a plan to user |
| GET    | /admin/subscriptions              | List all subscriptions (filterable) |
| POST   | /admin/subscriptions/:id/refund   | Issue refund (Stripe) |
| POST   | /admin/subscriptions/:id/cancel   | Cancel subscription |
| GET    | /admin/plans                      | List all plans |
| POST   | /admin/plans                      | Create a new plan |
| PATCH  | /admin/plans/:id                  | Update plan |
| DELETE | /admin/plans/:id                  | Archive plan |
| GET    | /admin/categories                 | Global system categories |
| POST   | /admin/categories                 | Create global category |
| PATCH  | /admin/categories/:id             | Update global category |
| DELETE | /admin/categories/:id             | Delete global category |
| GET    | /admin/logs                       | Audit log entries (filterable) |
| GET    | /admin/email-templates            | List email templates |
| PATCH  | /admin/email-templates/:id        | Update template |
| GET    | /admin/settings                   | All global settings |
| PATCH  | /admin/settings                   | Update settings (SMTP, maintenance, etc.) |

**Response envelope:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 0, "page": 1, "limit": 20, "pages": 0 }
}
```

---

### 6. Frontend Architecture (Next.js App Router)

#### 6.1 Route Structure

```
app/
├── (public)/
│   ├── page.tsx                     # Landing
│   ├── pricing/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── terms/page.tsx
│   └── privacy/page.tsx
├── (dashboard)/
│   ├── layout.tsx                   # Auth‑protected sidebar layout
│   ├── dashboard/page.tsx
│   ├── transactions/page.tsx
│   ├── categories/page.tsx
│   ├── budgets/page.tsx
│   ├── goals/page.tsx
│   ├── reports/page.tsx
│   ├── family/page.tsx
│   ├── settings/page.tsx
│   └── billing/page.tsx
├── (admin)/
│   ├── layout.tsx                   # Admin sidebar (role guard)
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── plans/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── logs/page.tsx
│   │   ├── email-templates/page.tsx
│   │   └── settings/page.tsx
└── not-found.tsx                    # Custom 404
```

- Middleware guards routes based on authentication cookie and user role.

#### 6.2 State Management – Redux Toolkit Query

All server state is managed with **RTK Query**. API slices are defined for each domain (auth, transactions, budgets, etc.). Mutations automatically invalidate relevant cache tags. Client‑only UI state (sidebar, theme, local filters) is kept in a simple Redux slice or Zustand store.

#### 6.3 Charts – Apache ECharts

All analytic visualisations use **Apache ECharts** for interactive, responsive, and highly customizable charts. Core chart types:

- Monthly income/expense – grouped bar
- Category breakdown – donut/pie
- Daily trend – line/area
- Budget progress – gauge (optional)

---

### 7. Security & Compliance

- HTTPS only with Helmet security headers.
- CORS allowlist from environment.
- Rate limiting: 200 requests/15 min general, 20 requests/15 min for auth endpoints.
- Zod request validation.
- File upload size limits (receipt 5 MB, CSV 1 MB).
- Refresh token single‑use policy – used tokens are revoked immediately, preventing replay attacks.
- GDPR‑friendly: users can export their data and request full account deletion.
- Stripe handles PCI‑DSS compliant payment processing.

---

### 8. Deployment & DevOps

- **Backend**: Dockerised application on AWS ECS Fargate; PostgreSQL (RDS), Redis (ElastiCache).
- **Frontend**: Next.js deployed on Vercel (with SSR/SSG) or any Node.js server.
- **CI/CD**: GitHub Actions workflow – lint, type‑check, unit/integration tests, build Docker image, push to registry, deploy.
- **Jobs**: `node‑cron` runs inside the API process for recurring transactions and budget alerts. In a multi‑replica scenario, a dedicated scheduler instance is required.
- **Monitoring**: Sentry for errors, Pino for structured logs, dashboards with Datadog/Axiom.
