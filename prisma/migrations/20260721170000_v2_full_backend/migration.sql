CREATE TYPE "RecurringRule" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE', 'LIFETIME');
CREATE TYPE "FamilyRole" AS ENUM ('VIEWER', 'EDITOR');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('BUDGET_ALERT', 'SUBSCRIPTION', 'SYSTEM');

-- Native UUID conversion requires temporarily removing the v1 foreign keys.
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_userId_fkey";
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";
ALTER TABLE "SavingsGoal" DROP CONSTRAINT "SavingsGoal_userId_fkey";
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

ALTER TABLE "User"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "password" DROP NOT NULL,
  ALTER COLUMN "currency" SET DEFAULT 'USD',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ADD COLUMN "googleId" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN "notificationPreferences" JSONB NOT NULL DEFAULT '{"emailBudgetAlerts":true,"inAppBudgetAlerts":true,"subscriptionEmails":true}',
  ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "twoFactorSecret" TEXT,
  ADD COLUMN "trialEndsAt" TIMESTAMPTZ(3),
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "lastLoginAt" TIMESTAMPTZ(3),
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3);
UPDATE "User" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Category"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3);
UPDATE "Category" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Transaction"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "categoryId" TYPE UUID USING "categoryId"::uuid,
  ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2),
  ALTER COLUMN "date" TYPE DATE USING "date"::date,
  ALTER COLUMN "note" TYPE VARCHAR(500),
  ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "recurringRule" TYPE "RecurringRule"
    USING CASE
      WHEN "recurringRule" IN ('DAILY', 'WEEKLY', 'MONTHLY')
      THEN "recurringRule"::"RecurringRule"
      ELSE NULL
    END,
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ADD COLUMN "receiptPublicId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3);
UPDATE "Transaction" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Budget"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "categoryId" TYPE UUID USING "categoryId"::uuid,
  ALTER COLUMN "categoryId" DROP NOT NULL,
  ALTER COLUMN "limit" TYPE DECIMAL(12,2) USING ROUND("limit"::numeric, 2),
  ADD COLUMN "rollover" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3);
UPDATE "Budget" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Budget" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "SavingsGoal"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "targetAmount" TYPE DECIMAL(12,2) USING ROUND("targetAmount"::numeric, 2),
  ALTER COLUMN "currentAmount" TYPE DECIMAL(12,2) USING ROUND("currentAmount"::numeric, 2),
  ALTER COLUMN "currentAmount" SET DEFAULT 0,
  ALTER COLUMN "deadline" TYPE DATE USING "deadline"::date,
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3);
UPDATE "SavingsGoal" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "SavingsGoal" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "RefreshToken"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE INDEX "Category_userId_type_idx" ON "Category"("userId", "type");
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
CREATE INDEX "Transaction_userId_type_date_idx" ON "Transaction"("userId", "type", "date");
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX "Budget_userId_year_month_idx" ON "Budget"("userId", "year", "month");
CREATE INDEX "SavingsGoal_userId_deadline_idx" ON "SavingsGoal"("userId", "deadline");
CREATE INDEX "RefreshToken_userId_revoked_idx" ON "RefreshToken"("userId", "revoked");

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Plan" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "interval" TEXT NOT NULL,
  "limits" JSONB NOT NULL,
  "stripePriceId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");

CREATE TABLE "Subscription" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "stripeSubscriptionId" TEXT,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "currentPeriodStart" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMPTZ(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_planId_status_idx" ON "Subscription"("planId", "status");

CREATE TABLE "RecurringOccurrence" (
  "id" UUID NOT NULL,
  "sourceTransactionId" UUID NOT NULL,
  "occurrenceDate" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringOccurrence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringOccurrence_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RecurringOccurrence_sourceTransactionId_occurrenceDate_key" ON "RecurringOccurrence"("sourceTransactionId", "occurrenceDate");

CREATE TABLE "SavingsContribution" (
  "id" UUID NOT NULL,
  "goalId" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "date" DATE NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavingsContribution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavingsContribution_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SavingsContribution_goalId_date_idx" ON "SavingsContribution"("goalId", "date");

CREATE TABLE "FamilyGroup" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "FamilyGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilyGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FamilyGroup_ownerId_idx" ON "FamilyGroup"("ownerId");

CREATE TABLE "FamilyMember" (
  "id" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "FamilyRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilyMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FamilyMember_groupId_userId_key" ON "FamilyMember"("groupId", "userId");
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");

CREATE TABLE "FamilyInvitation" (
  "id" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "invitedUserId" UUID,
  "role" "FamilyRole" NOT NULL DEFAULT 'VIEWER',
  "token" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilyInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FamilyInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FamilyInvitation_token_key" ON "FamilyInvitation"("token");
CREATE INDEX "FamilyInvitation_groupId_email_status_idx" ON "FamilyInvitation"("groupId", "email", "status");

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_userId_action_createdAt_idx" ON "AuditLog"("userId", "action", "createdAt");

CREATE TABLE "EmailTemplate" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

CREATE TABLE "GlobalSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GlobalSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "readAt" TIMESTAMPTZ(3),
  "dedupeKey" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

CREATE TABLE "StripeWebhookEvent" (
  "id" UUID NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");
