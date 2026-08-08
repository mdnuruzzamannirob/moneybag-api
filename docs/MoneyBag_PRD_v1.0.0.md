# MoneyBag – Product Requirements Document v1.0.0

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| Document ID | PRD-MB-001                                         |
| Version     | 1.0.0                                              |
| Status      | Ready for Engineering, Design, QA, and Ops Handoff |
| Product     | MoneyBag Web Application                           |
| Date        | 2026-08-08                                         |
| Owner       | Product Owner                                      |

---

## Document Purpose

This document defines the product requirements for MoneyBag v1.0.0. It replaces previous MoneyBag PRD versions.

This PRD defines:

- Product strategy and scope
- Subscription and entitlement model
- Workspace and tenant architecture
- Functional domains
- UX requirements
- Platform and integration requirements
- Security, privacy, and compliance requirements
- Internal operations requirements
- Delivery phasing

This document does not define detailed database implementation, frontend component architecture, or deployment topology. Those belong to the Backend Specification, Frontend Specification, API Contract, Design Specification, and Operations Specification.

---

## Table of Contents

- [1. Executive Strategy & Business Context](#section-1-executive-strategy--business-context)
- [2. Identity, Tenant & Access Architecture](#section-2-identity-tenant--access-architecture)
- [3. Subscription, Billing & Entitlement Engine](#section-3-subscription-billing--entitlement-engine)
- [4. Functional Domain Specifications](#section-4-functional-domain-specifications)
- [5. User Experience (UX) & Interaction Design](#section-5-user-experience-ux--interaction-design)
- [6. Platform Architecture, Data & Integrations](#section-6-platform-architecture-data--integrations)
- [7. Security, Privacy & Regulatory Compliance](#section-7-security-privacy--regulatory-compliance)
- [8. Internal Operations & Platform Administration](#section-8-internal-operations--platform-administration)
- [9. Delivery Strategy & Phased Rollout](#section-9-delivery-strategy--phased-rollout)
- [10. Appendix A — Product Owner Sign-Off Checklist](#appendix-a-product-owner-sign-off-checklist)

---

## Section 1: Executive Strategy & Business Context

---

### 1.1 Product Vision & Objectives

#### 1.1.1 Product Definition

MoneyBag is a multi-tenant financial ledger, planning, and workflow management platform. It provides a single unified account under which users can operate multiple isolated workspaces, each serving a distinct financial context — from individual expense tracking to organizational expense governance.

The platform operates on a **single-ladder subscription model** with five tiers:

| Tier       | Billing Model    | Capacity                      | Primary Use                           |
| ---------- | ---------------- | ----------------------------- | ------------------------------------- |
| Free       | $0               | 1 user, limited entities      | Basic personal tracking               |
| Solo       | Flat / user      | 1 user, unlimited entities    | Personal + freelance finance          |
| Team       | Flat / workspace | Up to 5 users                 | Shared expenses & basic collaboration |
| Business   | Per-seat         | Unlimited users               | Organizational expense governance     |
| Enterprise | Custom contract  | Unlimited users, multi-entity | Compliance, SSO, advanced controls    |

#### 1.1.2 Core Design Principles

1. **Single Account, Multiple Contexts:** A user maintains one identity. All financial environments (personal, shared, organizational) exist as isolated workspaces under that identity.
2. **Single Ladder, No Dual Tracks:** There is no separate "consumer product" and "business product." There is one product with one pricing page. Users move up the ladder as their needs grow.
3. **Data Isolation by Design:** Data from one workspace never leaks into another. A user's personal grocery budget is architecturally invisible from their company's approval dashboard.
4. **Progressive Complexity:** The system introduces features only when the user's tier and workspace type require them. A Free user sees a simple ledger. A Business user sees approval workflows, departmental budgets, and audit trails.
5. **No Financial Advice:** MoneyBag records, categorizes, and reports financial data. It does not provide investment recommendations, tax filing services, or legal financial advice.

#### 1.1.3 Business Objectives (First 12 Months)

| Objective                               | Target                                              |
| --------------------------------------- | --------------------------------------------------- |
| Launch Core Product                     | Phase 1 (Free + Solo) within Q1                     |
| Achieve Product-Market Fit (Individual) | 10,000 active Solo users by end of Q2               |
| Launch Collaboration                    | Phase 2 (Team) within Q2                            |
| Achieve Product-Market Fit (Shared)     | 2,000 active Team workspaces by end of Q3           |
| Launch Governance                       | Phase 3 (Business) within Q3                        |
| Achieve First B2B Revenue               | 50 paid Business workspaces by end of Q4            |
| Enterprise Readiness                    | Security documentation, SSO, audit logs ready by Q4 |

---

### 1.2 Success Metrics (KPIs)

Metrics are divided into four categories: Acquisition, Activation, Retention, and Revenue.

#### 1.2.1 Acquisition Metrics

| Metric                        | Definition                                | Target (Month 6) |
| ----------------------------- | ----------------------------------------- | ---------------- |
| New Registrations             | Total new accounts created                | 5,000 / month    |
| Registration Source Breakdown | Organic vs. Paid vs. Referral             | Track ratio      |
| Cost Per Acquisition (CPA)    | Ad spend / new paid users                 | < $15            |
| Social/Email Login Rate       | % of users using OAuth vs. email/password | > 60%            |

#### 1.2.2 Activation Metrics

| Metric                       | Definition                                                     | Target (Month 6) |
| ---------------------------- | -------------------------------------------------------------- | ---------------- |
| First Transaction Within 24h | % of new users who log a transaction within 24 hours of signup | > 40%            |
| Onboarding Completion Rate   | % of users who complete wallet setup + first transaction       | > 55%            |
| Time to First Value          | Median time from signup to first recorded transaction          | < 3 minutes      |
| Context Selection Rate       | % of Solo users who configure Business context toggle          | > 20%            |

#### 1.2.3 Retention Metrics

| Metric                          | Definition                                    | Target (Month 6) |
| ------------------------------- | --------------------------------------------- | ---------------- |
| Monthly Active Users (MAU)      | Users with ≥1 transaction in the month        | Track trend      |
| Free → Solo Conversion Rate     | % of Free users who upgrade to Solo           | > 4%             |
| Solo → Team Conversion Rate     | % of Solo users who create a Team workspace   | > 2%             |
| Team → Business Conversion Rate | % of Team workspaces that upgrade to Business | > 5%             |
| 30-Day Retention (Solo)         | % of Solo users active after 30 days          | > 65%            |
| 90-Day Retention (Business)     | % of Business workspaces active after 90 days | > 80%            |
| Churn Rate (Monthly)            | % of paid subscriptions canceled per month    | < 3%             |

#### 1.2.4 Revenue Metrics

| Metric                             | Definition                                                      | Target (Month 12) |
| ---------------------------------- | --------------------------------------------------------------- | ----------------- |
| Monthly Recurring Revenue (MRR)    | Total subscription revenue per month                            | $25,000           |
| Average Revenue Per User (ARPU)    | MRR / total paid users                                          | > $8              |
| Average Revenue Per Account (ARPA) | MRR / total paid workspaces                                     | > $12             |
| Seat Expansion Rate                | % increase in seats within existing Business accounts           | > 5% / quarter    |
| Annual Plan Adoption               | % of paid users on yearly billing                               | > 30%             |
| Trial → Paid Conversion            | % of trials that convert to paid                                | > 15%             |
| Net Revenue Retention (NRR)        | (Starting MRR + Expansion - Contraction - Churn) / Starting MRR | > 105%            |

---

### 1.3 Scope Definition

#### 1.3.1 In-Scope: Core Release (Phase 1 + Phase 2)

The Core Release includes everything required to launch Free, Solo, and Team tiers with full end-to-end functionality.

**Platform Foundation:**

- User registration (email/password + Google/Apple OAuth)
- Email verification and password recovery
- Two-factor authentication (TOTP + recovery codes)
- Workspace creation and context switching
- Role-based access control (Owner, Editor, Viewer for Team)
- Session management and secure logout

**Core Ledger Engine:**

- Wallet management (create, edit, archive, delete)
- Transaction recording (income, expense, transfer)
- Category management (default + custom)
- Tag system
- Multi-currency support (per-wallet, no auto-conversion)
- Recurring transaction automation
- CSV import with validation
- Balance recalculation engine

**Planning & Analytics:**

- Budget creation (monthly/yearly, category-specific or overall)
- Budget progress tracking with threshold alerts
- Savings goals with contribution/withdrawal tracking
- Monthly and yearly reports
- Category breakdown and trend visualization
- PDF/CSV export

**Solo Tier Features:**

- Unlimited wallets, transactions, budgets, goals
- Business context toggle (Personal ↔ Business)
- Client/project tagging
- Profit & Loss statement
- Tax summary report
- Receipt attachment (photo/file upload)
- Accountant read-only share link

**Team Tier Features:**

- Up to 5 members per workspace
- Shared wallets
- Expense splitting (Equal, Percentage, Exact, Shares)
- Net balance calculation
- Settlement recording with history
- Shared budgets
- Basic expense submission and single-level approval
- Member contribution reports

**Billing & Subscription:**

- Free, Solo, Team tier activation
- Monthly and yearly billing cycles
- 14-day free trial (no card required)
- Upgrade/downgrade with proration
- Failed payment grace period (7 days)
- Cancellation with 90-day data retention
- Billing history and invoice access

**Notifications:**

- In-app notification center
- Email notifications (welcome, verification, password reset)
- Budget threshold alerts
- Trial expiry reminders
- Subscription state changes
- Team invitation and settlement notifications

#### 1.3.2 In-Scope: Phase 3 (Business & Enterprise)

**Business Tier Features:**

- Unlimited members (per-seat billing, minimum 3 seats)
- Multi-level approval workflows
- Conditional approval rules (amount-based thresholds)
- Reimbursement hub with status pipeline
- Departmental and project budgets
- Custom roles and granular permissions
- Audit trail (tamper-evident logging)
- REST API access
- Webhooks
- Accounting software export (QuickBooks/Xero format)
- Receipt OCR extraction
- Bulk operations

**Enterprise Tier Features:**

- SSO (SAML 2.0 / OIDC)
- SCIM user provisioning
- Multi-entity management (subsidiaries/branches)
- Consolidated reporting across entities
- Custom data retention policies
- Data residency selection (US/EU/APAC)
- Dedicated account manager
- SLA guarantees
- Custom contract billing (invoice, purchase order)

#### 1.3.3 Out-of-Scope (Not in Any Phase)

The following are explicitly excluded from the MoneyBag product:

| Excluded Feature                            | Reason                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| Bank account synchronization / Open Banking | Regulatory complexity, deferred to future evaluation        |
| Automatic currency conversion               | Core Release uses explicit per-wallet currency, no FX rates |
| Investment portfolio tracking               | Different product domain, not a ledger feature              |
| Cryptocurrency wallet integration           | Regulatory and volatility concerns                          |
| Payroll processing                          | Requires separate compliance and banking infrastructure     |
| Tax filing / submission                     | MoneyBag provides tax reports, not filing services          |
| AI-generated financial advice               | Regulatory liability, product scope is recording/reporting  |
| Public developer API (Phase 1-2)            | API is restricted to Business/Enterprise tiers in Phase 3   |
| Native mobile applications (iOS/Android)    | Core Release is responsive web only                         |
| White-labeling / rebranding                 | Not in scope for any current tier                           |
| Lifetime / one-time purchase plans          | Subscription-only model                                     |
| Multiple Team groups under one subscription | One Team workspace per subscription                         |
| GitHub OAuth                                | Replaced by Apple OAuth for broader consumer reach          |

#### 1.3.4 Deferred Features (Planned, Not Committed)

These features are acknowledged as potential future additions but are not committed to any timeline:

- Progressive Web App (PWA) — offline caching, install prompt, background sync
- Scheduled report emails
- In-app announcement banners
- Advanced bill reminders
- Real-time collaborative editing
- Public Help Center / status page
- Blog / changelog pages
- Customer referral program
- Regional pricing / localized currency display

---

### 1.4 Market Positioning & Differentiators

#### 1.4.1 Competitive Landscape

| Competitor Category     | Examples                                 | MoneyBag Differentiation                                                                                  |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Personal Budgeting Apps | Mint (discontinued), YNAB, Copilot Money | MoneyBag extends beyond personal into shared and organizational finance on one platform                   |
| Expense Management      | Expensify, Ramp, Brex                    | MoneyBag includes personal and household finance, not just corporate expense                              |
| Accounting Software     | QuickBooks, Xero, FreshBooks             | MoneyBag is a ledger and workflow tool, not a double-entry accounting system. Lower complexity, faster UX |
| Bill Splitting Apps     | Splitwise, Tricount                      | MoneyBag integrates splitting into a full financial platform with budgets, reports, and workflows         |
| Spreadsheet / Manual    | Excel, Google Sheets                     | MoneyBag provides structured data, automation, multi-user access, and audit trails                        |

#### 1.4.2 Key Differentiators

1. **Single Platform, Full Lifecycle:** MoneyBag is the only product in scope that serves an individual from their first expense entry through freelance invoicing, household splitting, team approvals, and enterprise governance — without requiring platform migration.

2. **Context Switching Without Data Migration:** A Solo user can toggle between Personal and Business views instantly. A Team workspace can switch between Household and Small Team contexts. No data export/import or account recreation is required.

3. **Unified Pricing Ladder:** No separate "personal app" and "business app." One product, one pricing page, five tiers. Users never need to evaluate which "product line" they belong to.

4. **Governance at Scale:** Business and Enterprise tiers provide multi-level approvals, conditional rules, audit trails, and departmental isolation — features typically found only in enterprise expense management platforms, but offered at SMB-accessible pricing.

5. **Data Ownership & Portability:** Users can export all data (JSON/CSV) at any time. Account deletion follows a transparent 90-day retention policy. No vendor lock-in on financial records.

#### 1.4.3 Positioning Statement

> **For** individuals, households, freelancers, and organizations **who** need a single place to track, plan, and govern their finances,
> **MoneyBag is** a financial ledger and workflow platform **that** provides isolated workspaces, progressive feature unlocking, and end-to-end expense governance.
> **Unlike** single-purpose budgeting apps or enterprise-only expense tools,
> **MoneyBag** scales from a single user's first transaction to a multi-entity organization's approval workflow — on one account, one pricing ladder, and one platform.

---

## Section 2: Identity, Tenant & Access Architecture

This section defines MoneyBag’s identity model, workspace tenancy model, context switching, role-based access control, delegation, and security controls.

All authentication, authorization, and workspace isolation rules defined in this section are mandatory product requirements. Client-side visibility alone is never sufficient authorization.

---

### 2.1 Global Identity Management

#### 2.1.1 Account Model

MoneyBag operates on a single global identity model. Every user has exactly one global account. All workspaces, subscriptions, and permissions are linked to this account.

| Entity       | Definition                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| User Account | The global identity. Holds authentication credentials, profile settings, security preferences, and global notification preferences.                  |
| Workspace    | An isolated financial environment created under a User Account. Each workspace has its own data, members, roles, settings, and subscription context. |
| Membership   | The relationship between a User Account and a Workspace. Defines the user’s role and permissions within that specific workspace.                     |

Rules:

1. A User Account can own multiple Workspaces.
2. A User Account can be a member of Workspaces owned by other users.
3. A User Account can belong to only one active Team-tier workspace at a time.
4. A User Account can belong to multiple Business or Enterprise workspaces simultaneously.
5. Deleting a User Account does not delete Workspaces where other members exist.
6. If a user leaves or is removed from a shared workspace, shared financial history must remain intact.
7. Required historical attribution may remain as a non-identifying “Former Member” record while unrelated personal account data is deleted.

---

#### 2.1.2 Registration

| Method           | Requirements                                                                       |
| ---------------- | ---------------------------------------------------------------------------------- |
| Email + Password | Name, email address, and password. Email verification required before full access. |
| Google OAuth     | Valid Google account. Email is treated as verified if Google confirms ownership.   |
| Apple OAuth      | Valid Apple ID using Sign in with Apple. Supports shared email and Hide My Email.  |

GitHub OAuth is not supported.

##### Registration Flow

1. User submits registration form or initiates OAuth via Google or Apple.
2. System creates User Account in `pending_verification` state.
3. For email/password registration, the system sends a verification email.
4. For OAuth registration, email verification is accepted from the OAuth provider when the provider confirms ownership.
5. User clicks verification link or completes OAuth callback.
6. Account transitions to `active`.
7. Onboarding flow initiates.

##### Registration Constraints

1. One account per email address.
2. Duplicate registrations with the same email are rejected.
3. If Google OAuth returns an email that already exists as a MoneyBag account, the user must authenticate via the existing method before account linking is permitted.
4. If Apple OAuth returns a shared email that already exists as a MoneyBag account, the user must authenticate via the existing method before account linking is permitted.
5. Silent duplicate accounts are not created.
6. Social account linking allows a user to link multiple OAuth providers to one account.
7. Unlinking an OAuth provider is permitted only if at least one valid authentication method remains.

##### Apple “Hide My Email” Handling

1. If Apple OAuth uses Hide My Email, Apple’s stable user identifier is the authoritative account matching key.
2. The Apple private relay email is stored as the account contact email unless the user later adds and verifies a different email address.
3. If a user registers via Apple OAuth and the system detects an Apple private relay email, onboarding should prompt the user to add and verify a primary email address.
4. The user may skip this step.
5. A persistent, dismissible warning must remain in Account Settings until a standard, non-relay email address is verified.
6. Password recovery for Apple relay accounts follows the stored relay email address unless the user has added and verified another email.

---

#### 2.1.3 Authentication

| Method                 | Availability                   |
| ---------------------- | ------------------------------ |
| Email + Password       | All tiers                      |
| Google OAuth           | All tiers                      |
| Apple OAuth            | All tiers                      |
| TOTP Authenticator App | All tiers, optional            |
| Recovery Codes         | Generated when TOTP is enabled |
| SSO / SAML / OIDC      | Enterprise tier only           |

##### Password Rules

1. Passwords must be at least 8 characters long.
2. Passwords must include at least one uppercase letter.
3. Passwords must include at least one lowercase letter.
4. Passwords must include at least one digit.
5. Passwords must be hashed using a strong adaptive hashing algorithm such as bcrypt or Argon2id.
6. Plaintext passwords must never be stored.
7. Passwords must never be logged.
8. Passwords must never be transmitted in URL parameters.
9. Passwords must never appear in error messages.

##### Password Change

1. Users may change their password after confirming the current password or another approved strong verification method.
2. A successful password change invalidates all active sessions except the current session.
3. Password change events must be logged.

##### Password Recovery

1. Users may request a password-reset message.
2. The system sends a single-use, time-limited reset link to the registered email.
3. Recommended reset link expiry is 30 minutes.
4. The reset link is consumed after use.
5. Expired, reused, or invalid recovery attempts fail safely.
6. Failed recovery attempts must provide a clear restart action.
7. Password recovery responses must not reveal whether an email address exists.
8. A successful password reset invalidates all active sessions.

##### OAuth Provider Rules

| Provider | Email Handling                                                                      | Account Matching                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google   | Use Google-verified email when available.                                           | Match by verified email.                                                                                                                                                            |
| Apple    | Use shared verified email when available. If hidden, use Apple private relay email. | Match by Apple stable user identifier first. If a shared verified email exists and matches an existing account, require account linking through the existing authentication method. |

---

#### 2.1.4 Two-Factor Authentication

1. Signed-in users may configure app-based TOTP two-factor authentication.
2. When 2FA is enabled, sign-in requires a valid second-factor challenge.
3. Setup generates one-time recovery codes.
4. Recovery codes must be displayed once and stored hashed.
5. A valid unused recovery code may replace the normal second factor during sign-in.
6. Users may regenerate recovery codes after confirming their password or another approved strong verification method.
7. Regenerating recovery codes immediately invalidates previous codes.
8. Users may disable 2FA only after confirming their password and, where possible, a valid TOTP code.
9. 2FA cannot be disabled using only a recovery code.
10. Enterprise workspaces may enforce 2FA for all members.
11. If 2FA is enforced, users without a configured second factor must be blocked from accessing the Enterprise workspace until setup is complete.

---

#### 2.1.5 Session Management

1. Session tokens must be unpredictable and sufficiently long.
2. Session tokens must be transmitted only over HTTPS.
3. Web session cookies must use secure attributes appropriate for the environment.
4. Recommended cookie attributes include `Secure`, `HttpOnly`, and a safe `SameSite` value.
5. Sessions must expire after inactivity according to security policy.
6. “Remember me” sessions may have a longer duration but must remain revocable.
7. Users may view active sessions where practical and revoke them.
8. Administrators may revoke sessions for users within authorized workspaces where supported.
9. Concurrent sessions are permitted across devices unless restricted by Enterprise policy.
10. Sessions must be invalidated upon:

- logout,
- password change,
- 2FA disable,
- account deletion,
- confirmed account compromise,
- significant privilege change.

##### Recent Verification for Sensitive Actions

Sensitive actions require recent verification. Recent verification means the user has recently authenticated or confirmed a strong factor within a time window defined by the security policy.

Sensitive actions include:

1. Changing password.
2. Disabling 2FA.
3. Regenerating recovery codes.
4. Changing account email.
5. Deleting account.
6. Transferring workspace ownership.
7. Deleting a workspace.
8. Changing billing ownership.
9. Issuing refunds in Admin Console.
10. Manual entitlement changes in Admin Console.
11. Changing sensitive workspace security settings.

---

### 2.2 Workspace (Tenant) Topology

#### 2.2.1 Workspace Types

Every workspace belongs to exactly one type. The type determines available features, billing model, and role structure.

| Workspace Type | Associated Tiers     | Billing            | Max Members          | Isolation Level                            |
| -------------- | -------------------- | ------------------ | -------------------- | ------------------------------------------ |
| Single-User    | Free, Solo           | Flat per user      | 1                    | Full single-user isolation                 |
| Shared         | Team                 | Flat per workspace | 5                    | Full workspace isolation                   |
| Governed       | Business, Enterprise | Per seat           | Unlimited            | Full workspace plus departmental isolation |
| Multi-Entity   | Enterprise           | Custom contract    | Unlimited per entity | Full workspace plus entity-level isolation |

---

#### 2.2.2 Workspace Lifecycle States

| State       | Description                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `active`    | Workspace is fully operational. All permitted actions are available.                                                               |
| `trialing`  | Workspace is in a trial period. Full tier features are available. No charge has occurred.                                          |
| `past_due`  | Payment failed. Grace period active. Features remain accessible with warning.                                                      |
| `suspended` | Paid access has ended because of trial expiration, failed payment after grace, or cancellation period end. Workspace is read-only. |
| `archived`  | Workspace is in read-only retention and scheduled for deletion unless reactivated.                                                 |
| `deleted`   | Retention period ended. Workspace and associated data are scheduled for permanent deletion.                                        |

Rules:

1. Trial expiration for Solo downgrades the Single-User workspace to Free.
2. Trial expiration for Team or Business places the workspace into read-only retention.
3. Failed payment after grace period places Team, Business, or Enterprise workspaces into read-only retention.
4. Cancellation keeps paid access until the end of the current billing period.
5. After cancellation period end, the workspace enters read-only retention.
6. Read-only retention lasts 90 days by default.
7. Reactivation during retention restores access if subscription requirements are met.
8. After retention, workspace deletion is scheduled with warnings.
9. Suspended and archived workspaces must remain exportable where policy permits.
10. Workspace state changes must be audited.

---

#### 2.2.3 Workspace Creation

| Trigger                                | Result                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| New user completes onboarding          | System creates one Free Single-User workspace.                                                 |
| Solo user activates Business context   | No new workspace is created. Context toggle applies within the existing Single-User workspace. |
| User starts Team trial or purchase     | System creates a Shared workspace. User becomes Owner.                                         |
| User starts Business trial or purchase | System creates a Governed workspace. User becomes Admin.                                       |
| Enterprise contract activated          | System creates a Multi-Entity workspace with root entity. Admin provisions sub-entities.       |

Rules:

1. A user can have only one Single-User workspace.
2. A user can have only one Team workspace.
3. A user can have multiple Business workspaces.
4. A user can have multiple Enterprise workspaces.
5. Paid workspace creation requires trial activation or successful payment.
6. Workspace creation must not duplicate an existing workspace of the same type where the product rule limits the user to one.
7. Workspace creation must record the workspace type, context, timezone, and Owner/Admin.

---

#### 2.2.4 Workspace Deletion

##### General Deletion Rules

1. Single-User workspace deletion is tied to account deletion.
2. A Single-User workspace cannot be deleted independently while the account exists.
3. Shared workspace deletion requires Owner confirmation.
4. Governed workspace deletion requires Admin confirmation.
5. Where configured, Governed workspace deletion may require second-admin approval.
6. Non-owner member departure must not corrupt shared financial history.
7. Required historical attribution may remain as a non-identifying “Former Member” record.
8. Workspace deletion must notify affected members where applicable.

##### Deletion Constraint for Paid Workspaces

1. A paid workspace cannot be permanently deleted while an active, past-due, or trialing subscription exists.
2. The Owner/Admin must first cancel the subscription.
3. Upon cancellation, the workspace enters read-only retention.
4. Permanent deletion is permitted only after the retention period expires or where policy allows.
5. Administrative force-delete by MoneyBag Ops may cancel the subscription automatically.
6. Administrative force-delete must be reasoned, confirmed, and audited.

7. Permanent deletion is also permitted if the workspace is downgraded to a Free tier, where applicable.
8. Administrative force-delete automatically triggers subscription cancellation and halts future billing.

##### Owner Account Deletion

1. A Shared workspace Owner must transfer ownership or delete the workspace before deleting their account.
2. A Governed workspace Admin must ensure another Admin exists or initiate workspace deletion according to policy before deleting their account.
3. Account deletion requires clear warning and recent verification.
4. Account deletion must not immediately erase shared financial history where other members remain.

---

### 2.3 Context Switching & Data Isolation

#### 2.3.1 Context Model

Context defines the operational mode within a workspace. It changes the UI layout, default categories, dashboard widgets, terminology, and feature emphasis. Context does not create a separate data partition.

| Workspace Type               | Available Contexts    | Toggle Mechanism                                         |
| ---------------------------- | --------------------- | -------------------------------------------------------- |
| Single-User Free             | Personal              | Fixed. No toggle.                                        |
| Single-User Solo             | Personal, Business    | Toggle switch in top navigation.                         |
| Shared Team                  | Household, Small Team | Selected during workspace creation. Changeable by Owner. |
| Governed Business/Enterprise | Organization          | Fixed. No toggle.                                        |

---

#### 2.3.2 Solo Context Toggle: Personal ↔ Business

When a Solo user switches context:

| Element            | Personal Context                                                            | Business Context                                                                            |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dashboard Widgets  | Net worth, savings rate, budget progress, personal goals                    | P&L summary, tax-deductible total, client balances, invoice status                          |
| Default Categories | Personal categories such as food, transport, housing, entertainment, health | Business categories such as office supplies, software, travel, marketing, professional fees |
| Transaction Tags   | Personal tags                                                               | Client tags, project tags                                                                   |
| Reports            | Personal spending, category breakdown, trends                               | P&L statement, tax summary, client profitability                                            |
| Wallets            | All workspace wallets visible                                               | All workspace wallets visible                                                               |
| Budgets            | Personal budgets                                                            | Business budgets                                                                            |

Rules:

1. Context switching does not create a new workspace.
2. Context switching does not delete or hide data permanently.
3. All transactions remain in the same Single-User workspace.
4. Context switching applies filters and UI changes only.
5. A transaction tagged as Business remains visible in Personal context if the user removes the filter.
6. No data is hidden or partitioned by context.
7. The user owns all data in their Single-User workspace.
8. New Solo users start in Personal context.
9. Context selection is persisted per session.
10. Users may set a default context in preferences.

---

#### 2.3.3 Team Context Toggle: Household ↔ Small Team

When a Team workspace Owner changes context:

| Element              | Household Context                            | Small Team Context                                        |
| -------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Terminology          | “Split bill,” “Settle up,” “Shared budget”   | “Submit expense,” “Approve,” “Project budget”             |
| Dashboard            | Net balances, who owes whom, shared goals    | Pending approvals, reimbursement status, project spend    |
| Default Categories   | Groceries, rent, utilities, dining, vacation | Office, travel, software, marketing, client entertainment |
| Primary Actions      | Add shared expense, split, settle            | Submit expense, approve/reject, record reimbursement      |
| Member Roles Display | Owner, Editor, Viewer                        | Owner, Manager, Submitter, Viewer                         |

Rules:

1. All data remains in the same workspace.
2. Context change updates UI language, default categories, and dashboard layout.
3. Historical data is not modified.
4. Context can be switched at any time by the Owner.
5. No data migration is required.
6. Context change must be audited.

---

#### 2.3.4 Context Isolation Rule

1. The Solo Personal/Business toggle is strictly scoped to the Single-User workspace UI.
2. Switching to a Team or Business workspace via the global Workspace Switcher resets the UI context to that workspace’s native state.
3. Solo toggle state does not persist across workspaces.
4. Solo toggle does not affect Shared or Governed workspace data.
5. Team context toggle does not affect any user’s personal Single-User workspace.
6. Business and Enterprise workspaces have a fixed organization context.

---

#### 2.3.5 Cross-Workspace Data Isolation

1. Workspace data is accessible only to users with valid membership.
2. Cross-workspace access is prohibited unless explicitly authorized by product rules.
3. A user’s personal workspace data is never accessible from a Team, Business, or Enterprise workspace they belong to.
4. A Team or Business workspace’s data is never accessible from a user’s personal workspace.
5. Search, reports, exports, notifications, API responses, and file access must respect workspace isolation.
6. Background jobs must operate within workspace scope and must not leak tenant context.
7. Data access layers must enforce workspace scoping automatically for all workspace-scoped entities.
8. Application code must not rely on manually adding workspace filters for each query.
9. Cross-workspace queries are prohibited except for:
   - global user profile data,
   - authentication and session data,
   - billing provider reconciliation,
   - explicitly authorized administrative operations.
10. Any unauthorized cross-workspace access attempt must fail securely and be logged for security review.

---

### 2.4 Role-Based Access Control

#### 2.4.1 Role Definitions by Workspace Type

##### Single-User Workspace: Free / Solo

| Role  | Permissions                                           |
| ----- | ----------------------------------------------------- |
| Owner | Full access to all data and settings. Only one Owner. |

##### Shared Workspace: Team

| Role   | Permissions                                                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner  | Full access. Manage members, roles, settings, billing, deletion. One Owner at a time.                                                                    |
| Editor | Create, edit, and delete own permitted records. Create shared records. Record settlements. Cannot manage members, roles, billing, or workspace deletion. |
| Viewer | Read-only access to permitted shared data. Cannot create, edit, or delete records.                                                                       |

##### Governed Workspace: Business / Enterprise

| Role      | Permissions                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin     | Full access. Manage members, roles, departments, billing, workspace settings, deletion. Multiple Admins permitted.                           |
| Manager   | Approve/reject submissions within assigned department or scope. View permitted reports. Cannot manage billing or workspace settings.         |
| Submitter | Create and submit expense records. View own submissions and status. Cannot approve own submissions.                                          |
| Viewer    | Read-only access to permitted data. Cannot create, edit, or delete.                                                                          |
| Auditor   | Read-only access to all data including audit trail. Cannot create, edit, or delete. Cannot be assigned to a department unless policy allows. |

##### Multi-Entity Workspace: Enterprise

All Governed roles apply, plus:

| Role         | Permissions                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Entity Admin | Admin permissions scoped to a single sub-entity. Cannot access other entities or root-level settings. |
| Global Admin | Admin permissions across all entities and root-level settings.                                        |

---

#### 2.4.2 Governed Workspace Permission Matrix

| Action                      | Admin |        Manager |         Submitter |          Viewer | Auditor |
| --------------------------- | ----: | -------------: | ----------------: | --------------: | ------: |
| Create transaction          |     ✓ |              ✓ |                 ✓ |               ✗ |       ✗ |
| Edit own transaction        |     ✓ |              ✓ | ✓ before approval |               ✗ |       ✗ |
| Edit any transaction        |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Delete transaction          |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Submit expense for approval |     ✓ |              ✓ |                 ✓ |               ✗ |       ✗ |
| Approve/reject submission   |     ✓ | ✓ within scope |                 ✗ |               ✗ |       ✗ |
| Record reimbursement        |     ✓ |              ✓ |                 ✗ |               ✗ |       ✗ |
| Create/edit budget          |     ✓ | ✓ within scope |                 ✗ |               ✗ |       ✗ |
| View all transactions       |     ✓ | ✓ within scope |          Own only | Permitted scope |     All |
| View audit trail            |     ✓ |              ✗ |                 ✗ |               ✗ |       ✓ |
| Manage members              |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Manage roles                |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Manage billing              |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Delete workspace            |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |
| Export data                 |     ✓ | ✓ within scope |                 ✗ |               ✗ |       ✓ |
| Manage API keys             |     ✓ |              ✗ |                 ✗ |               ✗ |       ✗ |

---

#### 2.4.3 Role Assignment Rules

1. Every workspace must have at least one Owner or one Admin.
2. The last Owner of a Shared workspace cannot be removed without ownership transfer or workspace deletion.
3. The last Admin of a Governed workspace cannot be removed without adding another Admin.
4. Self-demotion is blocked for the last Owner or Admin.
5. Role changes require explicit confirmation from the acting Owner/Admin.
6. Role changes must be audited.
7. Department scoping applies in Business and Enterprise workspaces.
8. A Manager’s approval authority is limited to their assigned department unless policy allows broader access.
9. Custom roles may be created in Enterprise workspaces by combining permissions from the base permission matrix.
10. Custom roles are workspace-scoped.

---

#### 2.4.4 Invitation & Onboarding Flow

1. Owner/Admin invites a user by email address and selects a role.
2. System sends an invitation email.
3. Invitation is stored in `pending` state.
4. Invitee is not yet a member while invitation is pending.
5. Pending invitations do not consume paid seats.
6. Pending Team invitations do not consume member capacity.
7. Invitation acceptance is blocked if the Team workspace already has five active members.
8. A Team workspace may have up to ten pending invitations at one time.
9. Invitations expire after 14 days if not accepted.
10. Expired invitations may be resent.
11. Owner/Admin may revoke a pending invitation at any time before acceptance.
12. If the invitee already has a MoneyBag account with the invited email, the workspace is added to their account upon acceptance.
13. If the invitee has no account, they are directed to registration.
14. Upon registration and email verification, the invitee is added to the workspace.
15. Invitation acceptance requires authentication with the invited email address or a trusted OAuth provider linked to that email address.
16. A user cannot accept a Team invitation if they are already a member of another active Team workspace.
17. If a Team membership conflict occurs, the system displays a conflict message and blocks acceptance.
18. Invitation acceptance events must be logged.

---

### 2.5 Delegation & External Access

#### 2.5.1 Accountant / Advisor Access

Solo, Team, Business, and Enterprise workspaces may provide read-only external access.

| Parameter      | Behavior                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Link scope     | Business context data for Solo workspaces. Workspace-scoped data for Team/Business/Enterprise as permitted.  |
| Access level   | Read-only by default. No create, edit, delete, approve, or export permissions unless explicitly granted.     |
| Authentication | Link requires a unique token. The workspace may require the recipient to create a free MoneyBag account.     |
| Expiry         | Default expiry is 30 days. Custom expiry may be set where supported.                                         |
| Revocation     | The workspace Owner/Admin may revoke the link at any time. Revoked links return a safe unavailable response. |
| Audit          | Link creation, access, and revocation are logged.                                                            |
| Limit          | One active accountant share link per Solo workspace at a time.                                               |

Rules:

1. Accountant access in a Solo workspace exposes Business context data only.
2. Personal context data is not exposed unless explicitly permitted by the user.
3. External advisors cannot create, edit, delete, approve, or export unless explicitly granted by policy.
4. External access is time-limited and revocable.
5. External access events must be audited.

---

#### 2.5.2 External Auditor Access

Business and Enterprise Admins may grant time-limited read-only access to external auditors.

| Parameter        | Behavior                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| Role assigned    | Auditor                                                                       |
| Scope            | Transactions, budgets, reports, and audit trail within the workspace.         |
| Access level     | Read-only. Export may be granted explicitly by Admin.                         |
| Duration         | Time-limited. Admin sets start and end date.                                  |
| Maximum duration | 90 days per access grant. Can be renewed by Admin.                            |
| Authentication   | External auditor must have a MoneyBag account.                                |
| Notification     | All workspace Admins are notified when external access is granted or revoked. |
| Audit            | All external access grants, revocations, and data views are logged.           |

---

#### 2.5.3 Delegation Rules

1. No user gains access to a workspace by virtue of their role in another workspace.
2. A Manager in Workspace A has no access to Workspace B.
3. A Solo user’s accountant share link does not grant access to any Team or Business workspace the user belongs to.
4. All external access must be explicitly created by an Owner or Admin.
5. There is no auto-delegation.
6. All delegated access can be revoked at any time by the granting Owner/Admin.
7. All delegation events are recorded in the workspace audit trail.
8. Delegated access must expire automatically when the defined duration ends.

---

### 2.6 Security Controls Summary

| Control                    | Requirement                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Authentication enforcement | All API endpoints require valid session token or API authentication except public pages and auth endpoints. |
| Authorization enforcement  | All data queries are scoped by workspace identifier, membership, and role permissions.                      |
| Server-side enforcement    | Client-side UI hiding is not sufficient. Server-side authorization is mandatory.                            |
| Session protection         | Session tokens are stored securely and rotated on privilege change.                                         |
| Password storage           | Passwords are hashed using bcrypt, Argon2id, or equivalent. Plaintext storage is prohibited.                |
| 2FA secret storage         | TOTP secrets are encrypted at rest and never exposed in API responses after initial setup.                  |
| Recovery code storage      | Recovery codes are hashed and never stored in plaintext.                                                    |
| Rate limiting              | Login, password reset, invitation, checkout, API, and export endpoints are rate-limited.                    |
| Brute force protection     | After repeated failed login attempts, the account is temporarily locked or challenged.                      |
| CSRF protection            | State-changing requests require valid CSRF protection.                                                      |
| Input validation           | All user inputs are validated server-side.                                                                  |
| Output safety              | User-generated content is rendered safely.                                                                  |
| Error messages             | Authentication and authorization failures display generic safe messages.                                    |
| Audit logging              | Sensitive identity, membership, role, and workspace actions are logged.                                     |
| External access            | Delegated access is explicit, time-limited, revocable, and audited.                                         |

---

## Section 3: Subscription, Billing & Entitlement Engine

This section defines MoneyBag’s commercial model, entitlement enforcement, trial behavior, plan changes, billing lifecycle, seat management, limits, payment handling, and billing notifications.

Billing behavior must be deterministic, auditable, and clearly disclosed before any paid action is confirmed.

---

### 3.1 Commercial Model

MoneyBag uses a single subscription ladder with five tiers.

| Tier       |                          Price | Billing Model        | Workspace Type          | Capacity                        |
| ---------- | -----------------------------: | -------------------- | ----------------------- | ------------------------------- |
| Free       |                             $0 | Free forever         | Single-User             | 1 user                          |
| Solo       |           $6/month or $59/year | Flat per user        | Single-User             | 1 user                          |
| Team       |         $14/month or $139/year | Flat per workspace   | Shared                  | Up to 5 members                 |
| Business   | $9/user/month or $89/user/year | Per active paid seat | Governed                | Unlimited, minimum 3 paid seats |
| Enterprise |                         Custom | Annual contract      | Governed / Multi-Entity | Custom                          |

#### Commercial Rules

1. Launch billing currency is USD.
2. Monthly and yearly subscriptions provide the same tier entitlements.
3. Yearly pricing represents an approximate 17–18% saving compared with twelve monthly payments.
4. A paid subscription is attached to a workspace, not directly to the global user account.
5. A user may own multiple workspaces and may hold separate paid subscriptions for each workspace.
6. Entitlements granted by one workspace do not apply to another workspace.
7. A Solo subscription applies to a Single-User workspace.
8. A Team subscription applies to one Shared workspace.
9. A Business subscription applies to one Governed workspace.
10. An Enterprise subscription applies to one Enterprise contract workspace unless the contract explicitly defines multiple entities.
11. Prices may change in the future.
12. A price change applies only to new purchases or future renewals after advance notice.
13. Completed charges are not rewritten by future price changes.
14. Any applicable tax and final total must be disclosed before payment confirmation.

---

### 3.2 Tier-to-Workspace Mapping

| Tier       | Workspace Type          | Billing Basis               | Subscription Owner | Billing Manager                            |
| ---------- | ----------------------- | --------------------------- | ------------------ | ------------------------------------------ |
| Free       | Single-User             | None                        | User               | User                                       |
| Solo       | Single-User             | Flat user subscription      | User               | User                                       |
| Team       | Shared                  | Flat workspace subscription | Workspace Owner    | Workspace Owner                            |
| Business   | Governed                | Per active paid seat        | Workspace Admin    | Workspace Admin                            |
| Enterprise | Governed / Multi-Entity | Contract-based              | Global Admin       | Global Admin or designated billing contact |

#### Mapping Rules

1. A Single-User workspace may be Free or Solo.
2. A Shared workspace may only be Team.
3. A Governed workspace may be Business or Enterprise.
4. A user cannot convert a Free or Solo Single-User workspace directly into a Team workspace.
5. Creating a Team workspace creates a new Shared workspace.
6. A Team workspace may be converted into a Business workspace through an explicit upgrade conversion flow.
7. A Business workspace may be upgraded to Enterprise through contract activation.
8. Downgrades are permitted only when the target tier can preserve existing data in a readable state and the workspace satisfies the target tier’s capacity rules.

---

### 3.3 Entitlement Matrix

#### 3.3.1 Core Ledger Entitlements

| Capability                      |               Free |      Solo |      Team |                     Business |                 Enterprise |
| ------------------------------- | -----------------: | --------: | --------: | ---------------------------: | -------------------------: |
| Users                           |                  1 |         1 |   Up to 5 | Unlimited, min. 3 paid seats |                     Custom |
| Active wallets                  |                  1 | Unlimited | Unlimited |                    Unlimited |                  Unlimited |
| Transactions per calendar month |                 50 | Unlimited | Unlimited |                    Unlimited |                  Unlimited |
| Active budgets                  |                  1 | Unlimited | Unlimited |                    Unlimited |                  Unlimited |
| Active savings goals            |                  1 | Unlimited | Unlimited |                    Unlimited |                  Unlimited |
| Default categories only         |                Yes |        No |        No |                           No |                         No |
| Custom categories               |                 No |       Yes |       Yes |                          Yes |                        Yes |
| Custom tags                     |                 No |       Yes |       Yes |                          Yes |                        Yes |
| Recurring transactions          |                 No |       Yes |       Yes |                          Yes |                        Yes |
| Multi-currency wallets          |                 No |       Yes |       Yes |                          Yes |                        Yes |
| CSV import                      |                 No |       Yes |       Yes |                          Yes |                        Yes |
| Wallet transfers                |                 No |       Yes |       Yes |                          Yes |                        Yes |
| Report export                   |                 No |   PDF/CSV |   PDF/CSV |                      PDF/CSV |                    PDF/CSV |
| Financial reports               | Current month only |      Full |      Full |          Full + departmental | Full + entity-consolidated |

#### 3.3.2 Personal and Freelance Capabilities

| Capability                      | Free | Solo |              Team |                   Business |                 Enterprise |
| ------------------------------- | ---: | ---: | ----------------: | -------------------------: | -------------------------: |
| Personal context                |  Yes |  Yes | Context-dependent |                         No |                         No |
| Business context toggle         |   No |  Yes | Context-dependent | Fixed organization context | Fixed organization context |
| Client/project tags             |   No |  Yes |               Yes |                        Yes |                        Yes |
| Profit and loss statement       |   No |  Yes |               Yes |                        Yes |                        Yes |
| Tax summary report              |   No |  Yes |               Yes |                        Yes |                        Yes |
| Receipt/file attachment         |   No |  Yes |               Yes |                        Yes |                        Yes |
| Basic invoice creation          |   No |  Yes |               Yes |                        Yes |                        Yes |
| Invoice payment status tracking |   No |  Yes |               Yes |                        Yes |                        Yes |
| Accountant read-only share link |   No |  Yes |               Yes |                        Yes |                        Yes |
| Receipt OCR extraction          |   No |   No |                No |                        Yes |                        Yes |
| Mileage tracking                |   No |  Yes |               Yes |                        Yes |                        Yes |
| Time tracking for client work   |   No |  Yes |               Yes |                        Yes |                        Yes |

#### 3.3.3 Collaboration and Governance Capabilities

| Capability                    | Free | Solo |                   Team | Business |      Enterprise |
| ----------------------------- | ---: | ---: | ---------------------: | -------: | --------------: |
| Shared wallets                |   No |   No |                    Yes |      Yes |             Yes |
| Expense splitting             |   No |   No |                    Yes |      Yes |             Yes |
| Net balance calculation       |   No |   No |                    Yes |      Yes |             Yes |
| Settlement recording          |   No |   No |                    Yes |      Yes |             Yes |
| Shared budgets                |   No |   No |                    Yes |      Yes |             Yes |
| Shared savings goals          |   No |   No |                    Yes |      Yes |             Yes |
| Basic expense submission      |   No |   No |                    Yes |      Yes |             Yes |
| Single-level approval         |   No |   No |               Optional |      Yes |             Yes |
| Multi-level approval routing  |   No |   No |                     No |      Yes |             Yes |
| Conditional approval rules    |   No |   No |                     No |      Yes |             Yes |
| Reimbursement hub             |   No |   No |                  Basic | Advanced |        Advanced |
| Departmental budgets          |   No |   No |                     No |      Yes |             Yes |
| Project budgets               |   No |   No |                  Basic |      Yes |             Yes |
| Custom roles                  |   No |   No |                     No |      Yes |             Yes |
| Audit trail                   |   No |   No | Basic activity history |      Yes |        Advanced |
| API access                    |   No |   No |                     No |      Yes |             Yes |
| Webhooks                      |   No |   No |                     No |      Yes |             Yes |
| Accounting software export    |   No |   No |               CSV only |      Yes |             Yes |
| SSO / SAML / OIDC             |   No |   No |                     No |       No |             Yes |
| SCIM provisioning             |   No |   No |                     No |       No |             Yes |
| Multi-entity management       |   No |   No |                     No |       No |             Yes |
| Consolidated entity reporting |   No |   No |                     No |       No |             Yes |
| Data residency selection      |   No |   No |                     No |       No | Where supported |
| Custom data retention policy  |   No |   No |                     No |       No | Where supported |

#### 3.3.4 Support Entitlements

| Capability                | Free | Solo | Team     | Business      | Enterprise |
| ------------------------- | ---- | ---- | -------- | ------------- | ---------- |
| In-app help center        | Yes  | Yes  | Yes      | Yes           | Yes        |
| Standard email support    | Yes  | No   | No       | No            | No         |
| Priority email support    | No   | Yes  | Yes      | Yes           | Yes        |
| Live chat support         | No   | No   | Deferred | Yes           | Yes        |
| Dedicated account manager | No   | No   | No       | No            | Yes        |
| SLA                       | No   | No   | No       | No            | Yes        |
| Onboarding assistance     | No   | No   | No       | For 10+ seats | Yes        |

---

### 3.4 Trial Rules

| Tier       |          Trial Duration | Card Required | Trial Scope                                      |
| ---------- | ----------------------: | ------------- | ------------------------------------------------ |
| Solo       |                 14 days | No            | Full Solo features                               |
| Team       |                 14 days | No            | Full Team features, up to 5 members              |
| Business   |                 21 days | No            | Full Business features, up to 5 paid trial seats |
| Enterprise | Custom proof of concept | No            | Defined by contract                              |

#### Trial Eligibility Rules

1. One trial is available per verified email address per paid tier.
2. Deleting and recreating an account with the same email address does not restore trial eligibility.
3. A trial begins when the paid workspace is first activated.
4. A trial does not create a paid subscription automatically.
5. A trial does not store payment card details unless the user explicitly initiates a paid upgrade.
6. During the trial, the workspace has full entitlements for the selected tier.
7. The user receives a trial-ending reminder at least 24 hours before trial expiration.
8. Selecting a paid plan during the trial ends the trial when the paid subscription is successfully activated.
9. Trial conversion requires explicit payment confirmation and informed consent.
10. Trial status must be visible in workspace settings and billing overview.

#### Trial Expiration Behavior

| Workspace Type              | Behavior at Trial Expiration                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Single-User Solo trial      | The workspace downgrades to Free. Data remains readable. Creation is blocked where Free limits are exceeded.                      |
| Shared Team trial           | The workspace enters read-only suspension. The Owner may export data or activate a paid subscription within the retention period. |
| Governed Business trial     | The workspace enters read-only suspension. Admins may export data or activate a paid subscription within the retention period.    |
| Enterprise proof of concept | Access is disabled at the end of the agreed evaluation period unless a contract is activated.                                     |

---

### 3.5 Plan Changes and Conversions

#### 3.5.1 Upgrades

| Upgrade Path                       | Effective Timing                                             | Behavior                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Free → Solo                        | Immediate                                                    | The Single-User workspace receives Solo entitlements immediately.                                                                 |
| Solo monthly → Solo yearly         | Immediate or next renewal, depending on provider calculation | The system displays prorated credit or charge before confirmation.                                                                |
| Team monthly → Team yearly         | Immediate or next renewal, depending on provider calculation | The system displays prorated credit or charge before confirmation.                                                                |
| Team → Business                    | Immediate after conversion confirmation                      | The Shared workspace is converted into a Governed workspace. Billing changes from flat Team pricing to per-seat Business pricing. |
| Business monthly → Business yearly | Immediate or next renewal                                    | The system displays prorated credit or charge before confirmation.                                                                |
| Business → Enterprise              | Effective per contract                                       | Enterprise entitlements are enabled after contract activation.                                                                    |

#### Upgrade Rules

1. A successful upgrade becomes active immediately unless the payment provider requires end-of-period activation.
2. Any prorated credit or charge must be displayed before confirmation.
3. The effective date, amount, billing cadence, renewal behavior, and access consequences must be displayed before confirmation.
4. Upgrades do not delete existing data.
5. Upgrades must not create duplicate subscriptions for the same workspace.
6. A user may upgrade a workspace only if they hold the required Owner or Admin role.
7. Upgrade actions require recent verification where billing ownership or sensitive payment changes are involved.
8. Repeated upgrade submissions must not create duplicate charges.

---

#### 3.5.2 Team to Business Conversion

A Team workspace may be converted into a Business workspace.

##### Conversion Requirements

1. The workspace must be active or trialing.
2. The acting user must be the Team Owner.
3. The Owner must confirm the conversion explicitly.
4. The Owner must assign each existing member to a Business role.
5. The workspace must have at least three paid seats after conversion.
6. Members assigned to Viewer or Auditor roles do not consume paid seats.
7. Members assigned to Admin, Manager, or Submitter roles consume paid seats.

##### 3.5.2.1 Role Mapping Rules During Conversion

When converting a Team workspace to a Business workspace, existing member roles must be explicitly mapped to Governed workspace roles before the conversion can be finalized.

| Team Role | Business Role Mapping                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| Owner     | Automatically becomes Business Admin                                               |
| Editor    | Must be explicitly assigned as Manager or Submitter by the Owner during conversion |
| Viewer    | Automatically becomes Business Viewer                                              |

Additional role mapping rules:

1. The Team Owner automatically becomes the Business Admin.
2. Team Editors cannot remain unmapped.
3. The Owner must choose Manager or Submitter for each Team Editor during the conversion flow.
4. Team Viewers automatically become Business Viewers.
5. Business Viewers are free seats.
6. Business Admins, Managers, and Submitters are paid seats.
7. The conversion flow must block completion until all existing members are mapped to valid Business roles.
8. The conversion flow must block completion unless the workspace satisfies the minimum requirement of three paid seats.
9. If the workspace has fewer than three members assigned to paid roles, the Owner must add members or purchase the minimum required seats.
10. Role mapping decisions must be displayed before conversion confirmation.
11. Role mapping decisions must be audited.

##### Conversion Behavior

| Item                     | Behavior                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Transactions             | Preserved                                                                                                              |
| Wallets                  | Preserved                                                                                                              |
| Categories               | Preserved                                                                                                              |
| Tags                     | Preserved                                                                                                              |
| Budgets                  | Preserved                                                                                                              |
| Split expenses           | Preserved                                                                                                              |
| Settlement history       | Preserved                                                                                                              |
| Member records           | Preserved with new Business roles                                                                                      |
| Billing                  | Unused Team subscription value is credited or prorated according to the payment provider                               |
| Audit trail              | Business audit logging begins at conversion. Prior Team activity remains in existing activity history where available. |
| API keys                 | Created only after conversion is complete                                                                              |
| Custom roles             | Available after conversion                                                                                             |
| Departments and projects | Available after conversion                                                                                             |
| Multi-level approvals    | Available after conversion                                                                                             |

---

#### 3.5.3 Downgrades

| Downgrade Path             | Effective Timing                                           | Behavior                                                                                                                    |
| -------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Solo → Free                | End of current paid billing period                         | The Single-User workspace becomes Free. Existing data remains readable. Creation is blocked where Free limits are exceeded. |
| Solo yearly → Solo monthly | End of current yearly period                               | The monthly cadence begins at renewal.                                                                                      |
| Team yearly → Team monthly | End of current yearly period                               | The monthly cadence begins at renewal.                                                                                      |
| Team cancellation          | End of current paid billing period                         | The Shared workspace enters read-only retention.                                                                            |
| Business → Team            | End of current paid billing period, subject to eligibility | The Governed workspace becomes a Shared workspace. Business-only features become read-only or disabled.                     |
| Business cancellation      | End of current paid billing period                         | The Governed workspace enters read-only retention.                                                                          |
| Enterprise → Business      | End of contract term, subject to eligibility               | Enterprise-only features become read-only or disabled.                                                                      |

#### Downgrade Rules

1. A downgrade preserves data.
2. Existing records remain readable.
3. A downgrade does not retroactively delete financial history.
4. Creation is blocked when the lower tier’s active limit has already been exceeded.
5. A Business-to-Team downgrade is permitted only if the workspace has five or fewer active members after role assignment.
6. A Business-to-Team downgrade requires all members to be mapped to Team roles: Owner, Editor, or Viewer.
7. Business-only records, including custom roles, API keys, webhooks, departmental budgets, multi-level approval rules, and audit logs, remain readable where technically possible but cannot be edited or used under Team entitlements.
8. If a downgrade cannot be applied safely, the system must block the downgrade and provide actionable resolution steps.
9. Downgrade confirmation must display the resulting access state and data limitations.

---

#### 3.5.4 New Workspace Purchases

A user may create and pay for a new workspace without canceling an existing workspace.

| Existing State             | New Purchase       | Result                                                                              |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Free Single-User workspace | Team workspace     | User retains Free personal workspace and owns a new paid Team workspace.            |
| Solo Single-User workspace | Team workspace     | User retains Solo personal workspace and owns a new paid Team workspace.            |
| Solo Single-User workspace | Business workspace | User retains Solo personal workspace and administers a new paid Business workspace. |
| Team workspace             | Business workspace | User may convert the Team workspace or create a separate Business workspace.        |

Rules:

1. Entitlements do not transfer across workspaces.
2. A Solo subscription does not grant Team or Business capabilities in another workspace.
3. A Team subscription does not grant Solo capabilities in a personal workspace.
4. Each workspace maintains its own subscription, billing profile, and entitlement state.

---

### 3.6 Billing Lifecycle State Machine

#### 3.6.1 Subscription States

| State                         | Definition                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `trialing`                    | Trial is active. Full tier entitlements are available. No charge has occurred.                                                         |
| `active`                      | Paid subscription is current. Full entitlements are available.                                                                         |
| `past_due`                    | Payment failed. The subscription is in the seven-day grace period. Entitlements remain available with a warning.                       |
| `canceled_pending_period_end` | Cancellation has been requested. Paid access remains until the end of the current billing period.                                      |
| `suspended`                   | Paid access has ended because of trial expiration, failed payment after grace, or cancellation period end. The workspace is read-only. |
| `reactivated`                 | A suspended or past-due subscription has been restored through successful payment.                                                     |
| `terminated`                  | Retention period ended. The workspace is scheduled for permanent deletion.                                                             |

#### 3.6.2 State Transitions

```text
trialing
  ├──(successful payment)──► active
  ├──(trial expires)──► suspended
  └──(user cancels trial)──► suspended

active
  ├──(payment fails)──► past_due
  ├──(user cancels)──► canceled_pending_period_end
  ├──(period ends with successful renewal)──► active
  └──(admin suspension)──► suspended

past_due
  ├──(payment succeeds)──► active
  └──(7 days unresolved)──► suspended

canceled_pending_period_end
  ├──(user reverses cancellation before period end)──► active
  └──(period ends)──► suspended

suspended
  ├──(successful payment or resubscription)──► active
  └──(90 days elapsed)──► terminated
```

#### 3.6.3 Workspace Access by Subscription State

| Subscription State                               | Single-User Workspace                                                                      | Shared Workspace                       | Governed Workspace                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------- |
| `trialing`                                       | Full trial entitlements                                                                    | Full trial entitlements                | Full trial entitlements                |
| `active`                                         | Full paid entitlements                                                                     | Full paid entitlements                 | Full paid entitlements                 |
| `past_due`                                       | Full entitlements with payment warning                                                     | Full entitlements with payment warning | Full entitlements with payment warning |
| `canceled_pending_period_end`                    | Full entitlements until period end                                                         | Full entitlements until period end     | Full entitlements until period end     |
| `suspended` after Solo cancellation              | Downgraded to Free, readable data, creation blocked where limits exceeded                  | Read-only retention                    | Read-only retention                    |
| `suspended` after Team/Business trial expiration | Not applicable                                                                             | Read-only retention                    | Read-only retention                    |
| `suspended` after failed payment grace           | Downgraded to Free if Solo; readable data                                                  | Read-only retention                    | Read-only retention                    |
| `terminated`                                     | Not applicable for Solo downgrade; applies only if account/workspace deletion is requested | Scheduled deletion                     | Scheduled deletion                     |

#### Billing State Rules

1. Subscription state transitions must be explicit and validated.
2. Invalid state transitions must be rejected and logged.
3. Billing state changes must not corrupt ledger data.
4. Billing state changes must not silently delete workspace data.
5. Payment provider events must be processed idempotently.
6. Duplicate payment events must not create duplicate entitlements or duplicate charges.
7. Subscription state changes must be visible in Admin Console where authorized.
8. Subscription state changes must trigger required billing notifications.

---

### 3.7 Failed Payment and Grace Period

1. A failed renewal places the subscription in `past_due` state.
2. The grace period is seven consecutive days from the first failed payment attempt.
3. During the grace period, paid entitlements remain active.
4. The workspace displays a clear payment warning banner.
5. The billing manager receives email notifications when payment fails.
6. Retry attempts may occur on day 1, day 3, day 5, and day 7 after the initial failure.
7. The user may manually retry payment at any time during the grace period.
8. If payment succeeds during the grace period, the subscription returns to `active`.
9. If payment remains unresolved after seven days, the workspace enters `suspended` read-only retention.
10. A failed payment must not silently delete data.
11. A failed payment must not create a duplicate subscription.
12. A failed payment must not corrupt financial records.

#### Tier-Specific Suspension Behavior

| Tier       | Suspension Behavior                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solo       | The Single-User workspace downgrades to Free. Existing data remains readable. Creation is blocked where Free limits are exceeded.                                                      |
| Team       | The Shared workspace becomes read-only. Members cannot create, edit, delete, invite, split, settle, or change settings. Export remains available to the Owner.                         |
| Business   | The Governed workspace becomes read-only. Members cannot create, edit, approve, delete, invite, or change settings. Export remains available to Admins. API and webhooks are disabled. |
| Enterprise | Behavior follows the contract. Default behavior is read-only suspension unless the contract specifies otherwise.                                                                       |

---

### 3.8 Cancellation, Retention, and Deletion

#### 3.8.1 Cancellation

1. A user with billing authority may cancel a subscription at any time.
2. Cancellation prevents the next renewal.
3. Paid access remains until the end of the current paid billing period.
4. Cancellation requires confirmation.
5. The confirmation screen must display the effective cancellation date and the resulting access state.
6. Cancellation does not automatically delete data.
7. Cancellation must be visible in billing overview.
8. Scheduled cancellation may be reversed before the current period ends.

##### Deletion Constraint for Paid Workspaces

A Shared or Governed workspace cannot be permanently deleted by the Owner/Admin while an active, past-due, or trialing subscription exists.

- The Owner/Admin must first explicitly cancel the subscription.
- Upon cancellation, the workspace enters the 90-day read-only retention period.
- Permanent deletion is only permitted after the retention period expires, or if the workspace is downgraded to a Free tier (where applicable).
- _Admin Console Exception:_ MoneyBag internal administrators may force-delete a paid workspace for legal/abuse reasons, which automatically triggers subscription cancellation and halts future billing.

#### 3.8.2 Retention After Paid Access Ends

When a Team, Business, or Enterprise workspace loses paid access, it enters read-only retention for 90 days.

|    Day | System Behavior                                                           |
| -----: | ------------------------------------------------------------------------- |
|  Day 0 | Workspace becomes suspended/read-only. Owner/Admin receives notification. |
| Day 30 | Retention reminder sent to Owner/Admin.                                   |
| Day 60 | Retention warning sent.                                                   |
| Day 75 | Deletion warning sent.                                                    |
| Day 85 | Final deletion warning sent.                                              |
| Day 90 | Workspace is scheduled for permanent deletion.                            |

#### Retention Rules

1. During retention, all workspace data is read-only.
2. During retention, the Owner or Admin may export available data.
3. During retention, the Owner or Admin may reactivate the workspace by successfully resubscribing.
4. Reactivation restores active access if the workspace still satisfies tier requirements.
5. Personal workspaces owned by members are not affected by another workspace’s suspension or deletion.
6. A suspended workspace cannot invite new members.
7. A suspended workspace cannot generate recurring transactions.
8. A suspended workspace cannot send notifications except required billing, retention, and deletion notices.
9. Audit logs required for legal or security purposes may be retained separately from user-facing financial data.
10. Retention deadline must be visible in Admin Console and workspace billing state where applicable.

#### 3.8.3 Solo Cancellation Difference

A canceled Solo subscription does not place the Single-User workspace into read-only retention because a Free tier exists for Single-User workspaces.

At the end of the Solo billing period:

1. The workspace becomes Free.
2. Existing wallets, transactions, budgets, goals, categories, tags, reports, and attachments remain readable.
3. Creation is blocked where Free limits are exceeded.
4. Solo-only features become unavailable.
5. Business context toggle becomes unavailable.
6. The user may resubscribe to Solo at any time to restore Solo entitlements.

#### 3.8.4 Deletion

1. After the 90-day retention period, a suspended Team, Business, or Enterprise workspace is scheduled for deletion.
2. Deletion requires prior warnings at day 60, day 75, and day 85.
3. Deletion permanently removes workspace financial records, member relationships, settings, and shared attachments unless separate legal retention applies.
4. Personal records outside the workspace are unaffected.
5. A non-owner member’s historical shared attribution may remain as a non-identifying “Former Member” record if required for financial integrity.
6. Deletion cannot be initiated accidentally.
7. Deletion must be either the automatic result of the retention policy or an explicit confirmed administrative action.
8. Administrative deletion must be reasoned and audited.

---

### 3.9 Seat Management for Business and Enterprise

#### 3.9.1 Seat Definition

| Role Type          | Billing Treatment         |
| ------------------ | ------------------------- |
| Admin              | Paid seat                 |
| Manager            | Paid seat                 |
| Submitter          | Paid seat                 |
| Viewer             | Free                      |
| Auditor            | Free                      |
| Pending invitation | Not billed until accepted |
| Deactivated member | Not billed                |
| Removed member     | Not billed                |

#### 3.9.2 Minimum Seats

1. Business workspaces require a minimum of three paid seats.
2. If active paid members fall below three, the workspace continues to be billed for three seats until cancellation or seat addition.
3. Enterprise seat minimums are defined by contract.
4. Minimum seat requirements must be displayed before checkout and seat reduction.

#### 3.9.3 Adding Seats

| Event                                  | Billing Behavior                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Add paid member during monthly cycle   | Immediate access. Prorated charge for the remainder of the billing cycle.                              |
| Add paid member during annual cycle    | Immediate access. Provider-calculated prorated charge or invoice adjustment shown before confirmation. |
| Change member from Viewer to paid role | Seat becomes billable immediately. Proration applies.                                                  |
| Accept invitation into paid role       | Seat becomes billable at acceptance. Proration applies.                                                |

#### 3.9.4 Removing Seats

| Event                                   | Billing Behavior                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Remove paid member                      | Access revoked. Prorated credit applied according to payment provider.                   |
| Change paid member to Viewer or Auditor | Seat is freed. Prorated credit applied according to payment provider.                    |
| Deactivate paid member                  | Seat is freed. Data attribution remains according to workspace settings.                 |
| Remove below minimum seat count         | Billing remains at minimum seat count until seats are added or subscription is canceled. |

#### 3.9.5 Seat Reconciliation

1. The billing dashboard must display current paid seat count.
2. The billing dashboard must display free member count.
3. The billing dashboard must display pending invitations.
4. The billing dashboard must display next invoice estimate.
5. Seat changes must be audited.
6. Seat changes must not accidentally remove the last Admin.
7. The last Admin cannot be removed or demoted unless another Admin exists.
8. Seat changes require confirmation.
9. Repeated seat-change submissions must not create duplicate charges or credits.
10. Seat changes must update subscription entitlement immediately where the payment provider supports it.

---

### 3.10 Team Capacity and Invitation Rules

1. A Team workspace supports up to five active members, including the Owner.
2. All active roles count toward capacity: Owner, Editor, and Viewer.
3. Pending invitations do not consume member capacity.
4. Invitation acceptance is blocked if active members already equal five.
5. A Team workspace may have up to ten pending invitations at one time.
6. Invitations expire after 14 days if not accepted.
7. Expired invitations may be resent.
8. The Owner may revoke a pending invitation at any time before acceptance.
9. A user may belong to only one active Team workspace at a time.
10. A user may belong to multiple Business or Enterprise workspaces simultaneously.
11. Invitation acceptance requires the invitee to authenticate with the invited email address or a trusted OAuth provider linked to that email address.
12. If the invited email belongs to a user already in another Team workspace, acceptance is blocked and a conflict message is displayed.
13. Capacity violations must be blocked server-side.
14. Invitation capacity events must be logged.

---

### 3.11 Free Plan Limit Enforcement

#### 3.11.1 Transaction Limit

1. Free users may hold up to 50 personal transaction records dated within a calendar month.
2. The calendar month is determined by the transaction date in the user’s configured timezone.
3. If the user has no configured timezone, UTC is used.
4. A calendar month begins at 00:00:00 and ends at 23:59:59 in the configured timezone.
5. Income transactions count as one transaction record.
6. Expense transactions count as one transaction record.
7. Expense refund/reversal records count as one transaction record.
8. Transfers count as one user-visible transaction record.
9. Generated recurring transactions count as one transaction record.
10. Successfully imported CSV rows count as transaction records.
11. Updating a transaction does not add to the count unless the update moves the transaction into a different calendar month that has already reached the limit.
12. Editing an existing transaction within a full month is permitted if the edit does not create a new transaction record in that month.
13. Moving a transaction into a full month must be blocked.
14. Deleting a transaction removes it from the count for the month of its transaction date.
15. Recurring transaction generation must check the Free limit before creating the transaction.
16. If generation would exceed the limit, the system must not create a partial transaction.
17. Failed recurring generation must be recorded and notified.
18. CSV import must validate the Free limit before applying the import.
19. If an import would exceed the limit, the entire import must be rejected with actionable row-level feedback.
20. Partial import application is not permitted.

#### 3.11.2 Wallet, Budget, and Goal Limits

| Entity               | Free Limit | Limit Type     |
| -------------------- | ---------: | -------------- |
| Active wallets       |          1 | Active records |
| Active budgets       |          1 | Active records |
| Active savings goals |          1 | Active records |

Rules:

1. Limits count active records.
2. Archived or completed records remain readable.
3. Archived records do not count toward active limits.
4. An archived record may be reactivated only if the current active limit permits it.
5. If a limit is reached, creation attempts are blocked with a clear message and upgrade path.
6. Existing records are not deleted when a limit is reached.
7. Free users receive default categories only.
8. Free users cannot create custom categories.
9. Free users cannot use tags.
10. Free users cannot use recurring transactions.
11. Free users cannot use CSV import.
12. Free users cannot use multi-currency wallets.

#### 3.11.3 Over-Limit Behavior After Downgrade

When a Solo workspace downgrades to Free:

1. All existing data remains readable.
2. If the workspace has more than one active wallet, no new wallet may be created and wallet reactivation is blocked until the active wallet count is one or fewer.
3. If the workspace has more than one active budget, budget creation and reactivation are blocked until the active budget count is one or fewer.
4. If the workspace has more than one active savings goal, goal creation and reactivation are blocked until the active goal count is one or fewer.
5. If the current calendar month already contains more than 50 transactions, new transactions dated in that month are blocked until the count falls below 50 or the user upgrades.
6. Transactions dated in a different calendar month are evaluated against that month’s count.
7. Reports remain available for historical data, but Free report scope applies.
8. Solo-only features become unavailable.
9. Business context toggle becomes unavailable.
10. Custom categories and tags remain readable but cannot be created or edited under Free entitlements.

---

### 3.12 Payment, Tax, Invoices, Refunds, Coupons, and Disputes

#### 3.12.1 Payment Handling

1. Payment card data is handled by the approved payment provider.
2. MoneyBag does not store full card numbers, card security codes, or sensitive payment credentials.
3. Checkout must display the plan, billing cadence, amount, tax, total, effective date, renewal behavior, and cancellation policy before confirmation.
4. Paid-plan changes require informed consent.
5. Repeated checkout submissions must not create duplicate subscriptions or duplicate charges.
6. The system must use idempotent request handling for subscription creation, upgrade, seat addition, and payment retry where supported by the payment provider.
7. Payment success must update subscription state only after provider confirmation.
8. Payment failure must provide a clear error and safe retry path.
9. Canceled checkout must return the user to billing or plan selection without changing the subscription.

#### 3.12.2 Tax

1. Subscription prices are listed in USD.
2. Any applicable tax must be calculated before confirmation.
3. The final total, including tax, must be displayed before payment confirmation.
4. Invoices must display tax separately where required.
5. Business and Enterprise customers may provide a tax identifier or VAT/GST number where supported by the payment provider.
6. MoneyBag does not provide tax advice.
7. Tax calculation is limited to billing transactions.

#### 3.12.3 Invoices and Billing History

1. Paid users may access billing history.
2. Each successful charge must generate an invoice or receipt.
3. Invoices must include:
   - plan name,
   - billing period,
   - amount,
   - tax,
   - total,
   - payment date,
   - workspace identifier where applicable.
4. Billing history must remain accessible while the subscription is active and during retention.
5. After workspace deletion, billing records may be retained separately for legal, tax, or audit purposes as required.
6. Billing history must respect role permissions.

#### 3.12.4 Refunds

1. Refunds are not automatic.
2. An authorized Administrator may issue an eligible full or partial refund.
3. Before issuing a refund, the Administrator must view the resulting access consequences.
4. A full refund may result in immediate suspension or end-of-period suspension depending on the support decision and payment provider behavior.
5. A partial refund does not automatically change entitlements unless explicitly confirmed.
6. Refunds must be recorded in the billing audit history.
7. Refunds must be issued to the original payment method where supported by the payment provider.
8. Refund confirmation must display amount, reason, and access impact.

#### 3.12.5 Coupons and Promotional Codes

1. One eligible coupon may be applied to a purchase or subscription.
2. Coupon eligibility may be restricted by plan, billing cadence, expiration date, redemption count, and discount limit.
3. A coupon must not produce a negative charge.
4. A fixed-amount coupon greater than the charge amount reduces the charge to zero.
5. A percentage coupon is applied to the eligible subtotal before tax where required by the payment provider.
6. Coupons cannot be combined unless explicitly configured by an Administrator.
7. Coupon redemptions must be logged.
8. Deactivated coupons cannot be applied to new purchases.
9. Coupon usage statistics must be visible in Admin Console.

#### 3.12.6 Payment Disputes and Chargebacks

1. A payment dispute places the affected subscription in `past_due` or `suspended` state depending on the payment provider event.
2. The workspace displays a billing issue notice.
3. Financial data is not deleted immediately because of a dispute.
4. If the dispute is resolved in MoneyBag’s favor, the subscription is restored to `active` if the billing period is still valid.
5. If the dispute is unresolved and the retention period expires, normal suspension and deletion rules apply.
6. Abuse of disputes may result in account restriction after review by an authorized Administrator.
7. Dispute events must be logged.
8. Dispute resolution actions must be audited.

---

### 3.13 Billing Notifications

The following billing notifications are required and cannot be disabled by user preference.

| Notification               | Trigger                                                    | Recipients                                |
| -------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Trial ending reminder      | At least 24 hours before trial expiration                  | Trial workspace Owner/Admin               |
| Trial expired              | Trial expiration without paid activation                   | Trial workspace Owner/Admin               |
| Payment succeeded          | Successful subscription charge                             | Billing manager                           |
| Payment failed             | Failed renewal or seat charge                              | Billing manager                           |
| Grace period warning       | Entry into `past_due` state                                | Billing manager                           |
| Grace period final warning | Final retry opportunity before suspension                  | Billing manager                           |
| Subscription suspended     | Suspension after failed payment or cancellation period end | Billing manager and workspace Owner/Admin |
| Cancellation confirmation  | User cancels subscription                                  | Billing manager                           |
| Cancellation effective     | Paid access has ended                                      | Billing manager and workspace Owner/Admin |
| Retention reminder         | Day 30 of read-only retention                              | Workspace Owner/Admin                     |
| Deletion warning           | Day 60, day 75, and day 85 of retention                    | Workspace Owner/Admin                     |
| Seat added                 | Paid seat added to Business/Enterprise workspace           | Billing manager and Admins                |
| Seat removed               | Paid seat removed from Business/Enterprise workspace       | Billing manager and Admins                |
| Invoice available          | Invoice or receipt generated                               | Billing manager                           |
| Plan change confirmation   | Upgrade, downgrade, or cadence change confirmed            | Billing manager                           |
| Renewal reminder           | Seven days before annual renewal                           | Billing manager                           |

#### Notification Rules

1. Required billing notifications cannot be disabled.
2. Optional product notifications may be controlled by user preferences.
3. A failed notification delivery must not roll back a valid financial record unless the workflow explicitly requires successful delivery.
4. Billing notifications must clearly identify the workspace, plan, amount where relevant, and required user action.
5. Billing notification delivery state should be visible in internal operations tools.

---

## Section 4: Functional Domain Specifications

This section defines the functional behavior of MoneyBag’s core product modules. It describes what each domain must do, how financial records behave, and how features are gated by tier and workspace type.

---

### 4.0 Common Financial Rules

These rules apply to all financial domains unless a later section explicitly overrides them.

#### 4.0.1 Monetary Precision

1. All authoritative monetary values must be stored as integer minor units of the currency.
   - Example: $10.25 is stored as 1025 cents.
2. Floating-point arithmetic must not be used for authoritative balance calculations.
3. Every monetary value must have an explicit or unambiguous currency.
4. Every wallet must have exactly one currency.
5. MoneyBag does not perform automatic currency conversion in the Core Release.
6. Totals must not combine different currencies into one misleading amount. Results must be grouped or separated by currency.

7. Database persistence of monetary amounts must use integer minor units or fixed-precision decimal types. Floating-point types are prohibited for balances, transaction amounts, allocations, settlements, invoices, refunds, or billing amounts.
8. Transaction amount currency must match the wallet currency unless a future multi-currency transfer rule is explicitly approved.
9. Allocation sums, split amounts, settlement amounts, invoice line totals, and invoice grand totals must be validated at the service boundary to equal the parent total exactly in minor units.
10. If any financial calculation produces a rounding mismatch, the system must reject the mutation and display a safe validation error. Silent rounding corrections are not permitted unless the split allocation preview explicitly displays the rounding rule.

#### 4.0.2 Balance Effect Matrix

| Record Type             | Wallet Effect                | Income/Expense Report Effect | Budget Effect              | Member Balance Effect               |
| ----------------------- | ---------------------------- | ---------------------------- | -------------------------- | ----------------------------------- |
| Income                  | Increases wallet balance     | Included as income           | No                         | No                                  |
| Expense                 | Decreases wallet balance     | Included as expense          | Consumes budget            | Applies if shared allocation exists |
| Expense refund/reversal | Increases wallet balance     | Reduces expense total        | Reduces budget consumption | Applies if shared allocation exists |
| Transfer source         | Decreases source wallet      | Not included                 | No                         | No                                  |
| Transfer destination    | Increases destination wallet | Not included                 | No                         | No                                  |
| Goal contribution       | No wallet effect             | No                           | No                         | No                                  |
| Goal withdrawal         | No wallet effect             | No                           | No                         | No                                  |
| Settlement              | No wallet effect             | No                           | No                         | Adjusts shared member balance       |
| Draft transaction       | No wallet effect             | No                           | No                         | No                                  |
| Rejected transaction    | No wallet effect             | No                           | No                         | No                                  |
| Voided transaction      | Reversed or corrected        | Corrected                    | Corrected                  | Corrected                           |

#### 4.0.3 Timezone Rules

1. Single-User workspaces use the user’s configured timezone.
2. Shared and Governed workspaces use a workspace timezone configured by the Owner or Admin.
3. If no workspace timezone is configured, the Owner’s timezone at workspace creation is used.
4. Calendar-month and calendar-year boundaries are calculated using the applicable workspace timezone.
5. Reports must display the timezone used for the reported date range.
6. Changing a timezone must not silently rewrite historical records. Historical reports must clearly display the timezone applied at report generation time.

#### 4.0.4 Destructive Actions and Duplicate Prevention

1. Destructive financial actions require explicit confirmation.
2. Repeated submission requests must not create duplicate transactions, transfers, imports, settlements, invoices, subscription charges, or approval actions.
3. State-changing financial endpoints must support safe retry behavior.
4. A failed operation must not leave wallet balances, budget totals, member balances, or approval states inconsistent.
5. Financial corrections must preserve traceability. Silent rewriting of historical financial records is not permitted.

6. Financial mutation endpoints must support idempotency keys for create operations involving:
   - transactions,
   - transfers,
   - settlements,
   - invoices,
   - recurring template activation,
   - checkout and subscription creation,
   - seat changes,
   - refunds.
7. Replayed requests with the same idempotency key within the defined retention window must return the original response and must not create duplicate records or duplicate charges.
8. Idempotency keys should be retained for at least 24 hours unless the payment provider or billing workflow requires a longer retention period.
9. If an idempotency conflict is detected, the system must return the original result safely and log the duplicate attempt.

---

## 4.1 Core Ledger Engine

The Core Ledger Engine is the foundation of MoneyBag. It records wallets, categories, tags, transactions, transfers, recurring entries, and imports.

---

### 4.1.1 Wallets

#### Wallet Fields

| Field           | Requirement                                                   |
| --------------- | ------------------------------------------------------------- |
| Name            | Required                                                      |
| Type            | Required                                                      |
| Currency        | Required. Cannot be changed except under unused-wallet rules. |
| Opening Balance | Required at creation. May be positive, zero, or negative.     |
| Icon/Color      | Optional                                                      |
| Default Status  | One active wallet per workspace must be default.              |
| Status          | Active or Archived                                            |
| Notes           | Optional                                                      |

#### Supported Wallet Types

| Type               | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| Bank               | Standard bank account                                          |
| Cash               | Physical cash                                                  |
| Mobile Banking     | Mobile financial service account                               |
| Card               | Credit, debit, or prepaid card account                         |
| Investment Account | Balance tracking only. No portfolio analytics in Core Release. |

#### Wallet Rules

1. Users may create wallets within their plan limits.
2. Wallet balance is calculated as:

   ```text
   opening balance
   + income
   - regular expenses
   + expense refunds
   - transfer out
   + transfer in
   ```

3. A wallet balance may become negative. Negative balances must be displayed clearly.
4. When at least one active wallet exists in a workspace, exactly one active wallet must be marked as default.
5. If the default wallet is archived or deleted, another active wallet must become default before the action is completed.
6. A wallet may be archived while retaining its history.
7. Archived wallets remain available for historical reporting but cannot receive new transactions, transfers, or recurring generations.
8. A wallet may be permanently deleted only when:
   - its balance is zero, and
   - no transaction, transfer, budget, recurring template, import batch, invoice payment link, or other financial record references it.
9. A wallet’s currency may be changed only while:
   - its balance is zero, and
   - no financial record references it.
10. Wallet deletion requires confirmation.
11. In Governed workspaces, wallet creation, archiving, and deletion require Admin permission.

---

### 4.1.2 Categories

#### Default Categories

1. New workspaces receive useful default categories based on workspace context.
2. Free Single-User workspaces receive default categories only.
3. Free users cannot create, rename, edit, archive, or delete categories.
4. Solo, Team, Business, and Enterprise workspaces may customize categories according to tier entitlements.

#### Category Fields

| Field         | Requirement                   |
| ------------- | ----------------------------- |
| Name          | Required                      |
| Type          | Income or Expense             |
| Icon/Color    | Optional                      |
| Tax Treatment | Optional for Business context |
| Status        | Active or Archived            |

#### Category Rules

1. Categories are workspace-scoped.
2. Users may create and update categories within permitted tiers.
3. A referenced category cannot be deleted in a way that invalidates historical transactions.
4. If a category is referenced, it must be archived or its records must be explicitly reassigned before deletion.
5. A referenced category cannot change between income and expense in a way that reinterprets historical transactions.
6. Archived categories remain available for historical filtering and reporting.
7. Budgets may reference categories. If a category is archived, existing budgets referencing it remain readable, but new budgets cannot use the archived category.

---

### 4.1.3 Tags

| Tier           | Tag Availability      |
| -------------- | --------------------- |
| Free           | No tags               |
| Solo and above | Unlimited custom tags |

#### Tag Rules

1. Tags are workspace-scoped.
2. Tags may be attached to transactions.
3. Tags may be renamed or deleted.
4. Deleting a tag removes it from historical transactions but does not alter monetary values.
5. Tags may be used in filters and reports.
6. In Business and Enterprise workspaces, tags must not be used as a substitute for departments or projects where formal governance is required.

---

### 4.1.4 Transactions

#### Transaction Fields

| Field               | Requirement                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Wallet              | Required. Must be active.                                                                |
| Type                | Required: Income, Expense, or Expense Refund/Reversal. Transfers are handled separately. |
| Amount              | Required. Entered as a positive amount. Direction is determined by type.                 |
| Category            | Required. Must match transaction type.                                                   |
| Date                | Required. Calendar date.                                                                 |
| Description         | Optional but recommended.                                                                |
| Note                | Optional                                                                                 |
| Tags                | Optional where tier permits                                                              |
| Receipt Attachments | Optional where tier permits                                                              |
| Client/Project      | Optional where tier permits                                                              |
| Department          | Required or optional according to Governed workspace policy                              |
| Status              | Draft, Submitted, Approved, Rejected, Paid/Reimbursed, or Void where workflow applies    |

#### Transaction Creation Rules

1. Users may record income and expense transactions according to workspace role and tier.
2. A regular expense decreases the selected wallet balance.
3. Income increases the selected wallet balance.
4. An expense refund/reversal increases the selected wallet balance and reduces expense totals.
5. An expense refund/reversal must not be treated as ordinary income.
6. The transaction date determines reporting period and budget consumption.
7. Transactions must preserve correct wallet balances after creation, update, deletion, or voiding.
8. In Free workspaces, transaction creation is subject to the monthly transaction limit defined in Section 3.

#### Transaction Editing Rules

1. Users may edit transactions they are permitted to access.
2. Editing amount, type, wallet, category, date, or refund status must recalculate affected wallet balances, budgets, reports, and shared balances.
3. Moving a transaction into a calendar month that has reached the Free transaction limit must be blocked.
4. Editing an existing transaction within a full Free month is permitted if the edit does not create a new transaction record in that month.
5. In Governed workspaces, approved transactions cannot be silently edited. Corrections must follow the governed correction workflow.

#### Transaction Deletion Rules

1. In Single-User and Team workspaces, permitted users may delete transactions with confirmation.
2. Deleting a transaction recalculates wallet balances, budgets, reports, and shared balances.
3. Deleting a transaction removes it from the relevant monthly transaction count for Free workspaces.
4. In Governed workspaces:
   - Draft transactions may be deleted by their creator or an Admin.
   - Rejected transactions may be deleted by their creator or an Admin.
   - Approved posted transactions cannot be hard-deleted.
   - Approved posted transactions may be voided by an Admin.
   - Voiding creates an audited correction and preserves traceability.

#### Transaction Discovery

1. Users may search, filter, sort, and paginate transactions.
2. Supported filters must include:
   - wallet,
   - type,
   - category,
   - date range,
   - tags where available,
   - client/project where available,
   - department where available,
   - status where workflow applies,
   - amount range,
   - text search across description and note.
3. Supported sorting must include date, amount, category, and wallet.
4. Long transaction lists must support pagination or another scalable browsing method.

---

### 4.1.5 Transfers

#### Transfer Fields

| Field              | Requirement                                  |
| ------------------ | -------------------------------------------- |
| Source Wallet      | Required. Must be active.                    |
| Destination Wallet | Required. Must be active.                    |
| Amount             | Required. Positive value.                    |
| Currency           | Must be the same for source and destination. |
| Date               | Required. Calendar date.                     |
| Note               | Optional                                     |

#### Transfer Rules

1. A transfer moves an amount between two active wallets in the same workspace.
2. Source and destination wallets must use the same currency.
3. Source and destination wallets must not be the same wallet.
4. A transfer is displayed as one user-visible action.
5. Internally, a transfer is backed by linked source and destination activity.
6. Creating, editing, or deleting a transfer must affect both sides atomically.
7. Transfers are not income.
8. Transfers are not expenses.
9. Transfers do not consume budgets.
10. Transfers do not affect savings goals.
11. Transfers do not affect shared member balances.
12. Transfers must be excluded from income and expense reports.
13. A transfer may be listed separately in transaction history with a distinct transfer type.
14. Transfers are available in Solo and above tiers.
15. In Governed workspaces, transfers require Admin permission or explicit Admin-approved policy.

---

### 4.1.6 Recurring Transactions

#### Availability

| Tier       | Recurring Transactions |
| ---------- | ---------------------- |
| Free       | Not available          |
| Solo       | Available              |
| Team       | Available              |
| Business   | Available              |
| Enterprise | Available              |

#### Recurring Template Fields

| Field               | Requirement                                 |
| ------------------- | ------------------------------------------- |
| Description         | Required                                    |
| Wallet              | Required. Must be active.                   |
| Category            | Required. Must be active.                   |
| Type                | Income or Expense                           |
| Amount              | Required                                    |
| Frequency           | Daily, Weekly, or Monthly                   |
| Start Date          | Required                                    |
| End Condition       | Optional: end date or number of occurrences |
| Next Scheduled Date | System-calculated                           |
| Status              | Active, Paused, Failed, or Completed        |

#### Generation Rules

1. Recurring templates generate transactions on their scheduled date using the workspace timezone.
2. Generated transactions become normal ledger transactions after creation.
3. Template changes affect future occurrences only.
4. Past generated transactions are not rewritten when the template changes.
5. Deleting a recurring template does not delete previously generated transactions.
6. A recurring template may be paused and resumed.
7. If the referenced wallet or category becomes invalid, generation must fail safely.
8. If generation fails, the system must display a visible failure status.
9. A failed generation must not create a partial transaction.
10. If a Free workspace loses recurring entitlement, recurring templates become read-only and generation stops.
11. Existing generated transactions remain unaffected.
12. Recurring generation must respect Free transaction limits where applicable.

#### Monthly Frequency Rules

1. If the selected monthly date does not exist in a given month, generation uses the last day of that month.
2. Example: A template scheduled for day 31 generates on February 28 or February 29 where applicable.

---

### 4.1.7 CSV Transaction Import

#### Availability

| Tier           | CSV Import    |
| -------------- | ------------- |
| Free           | Not available |
| Solo and above | Available     |

#### Import Model

1. An import applies transactions to one selected destination wallet.
2. The user must map incoming CSV columns to MoneyBag fields.
3. Required fields:
   - Date
   - Amount
   - Type
4. Optional fields:
   - Description
   - Category
   - Tags
   - Note
   - Client/Project
   - Department, where applicable
5. The system must provide a downloadable CSV template.
6. Supported date format must be clearly defined. Default: `YYYY-MM-DD`.
7. Amounts must be positive. Direction is determined by transaction type.
8. Refunds may be imported using the expense refund/reversal type.

#### Validation Rules

1. The system must validate the file before applying any data.
2. Invalid files must provide actionable row-level feedback.
3. An import must not leave partially applied financial results.
4. If any row fails validation, the entire import must be rejected unless the user removes or corrects the invalid rows.
5. If an import would exceed Free plan limits, the entire import must be rejected.
6. Successful imports create transaction records and count toward applicable plan limits.
7. The system may flag potential duplicates based on date, amount, description, and destination wallet.
8. Duplicate flags must be shown before confirmation.
9. The user decides whether to import or skip flagged duplicates.
10. Import batches must be recorded with:
    - imported by,
    - imported at,
    - file name,
    - row count,
    - success/failure status,
    - resulting transaction count.

---

## 4.2 Planning and Forecasting

---

### 4.2.1 Budgets

#### Budget Fields

| Field           | Requirement                                   |
| --------------- | --------------------------------------------- |
| Name            | Required                                      |
| Scope           | Overall or Category-specific                  |
| Currency        | Required                                      |
| Period          | Monthly or Yearly                             |
| Limit Amount    | Required                                      |
| Alert Threshold | Optional. One percentage value from 1 to 100. |
| Rollover        | Optional. Disabled by default.                |
| Status          | Active or Archived                            |

#### Budget Rules

1. Users may create budgets within plan limits.
2. A budget may apply to all eligible expenses or to one expense category.
3. A budget applies to one currency only.
4. A budget must never combine spending from wallets using different currencies.
5. Monthly budgets follow calendar-month boundaries in the workspace timezone.
6. Yearly budgets follow calendar-year boundaries in the workspace timezone.
7. Budget progress must show:
   - limit,
   - spent amount,
   - remaining amount,
   - percentage used.
8. Archived budgets remain readable but do not track new spending unless reactivated.
9. Reactivation is permitted only if the active budget limit allows it.

#### Spending Calculation

1. Eligible expense transactions consume a budget.
2. Eligibility is determined by:
   - transaction date,
   - category,
   - currency,
   - workspace,
   - budget scope.
3. Income does not consume a budget.
4. Transfers do not consume a budget.
5. Expense refunds/reversals reduce the related spending total.
6. Creating, editing, deleting, or voiding a transaction must recalculate affected budget totals.
7. Budget spending must not include draft or rejected transactions.
8. Budget spending includes approved posted transactions only where workflow applies.

#### Rollover Rules

1. If rollover is enabled, a positive unspent amount from the immediately previous period may be added to the current period’s planning capacity.
2. Negative remaining amounts are not carried forward.
3. Rollover changes planning capacity only.
4. Rollover does not create wallet funds.
5. Rollover does not create a transaction.

#### Budget Alerts

1. A budget may have one optional alert threshold.
2. The threshold is expressed as a percentage of budget usage.
3. When spending crosses the threshold, the system generates a notification.
4. Budget alerts may be delivered in-app and by email according to user preferences.
5. Required billing and security notifications cannot be replaced by budget alerts.
6. Alert delivery must be rate-limited to avoid repeated notifications for minor edit-driven fluctuations.
7. Recommended rate limit: no more than one alert per budget per 24 hours unless the budget returns below the threshold and crosses it again.

---

### 4.2.2 Savings Goals

#### Goal Fields

| Field         | Requirement                                          |
| ------------- | ---------------------------------------------------- |
| Title         | Required                                             |
| Currency      | Required                                             |
| Target Amount | Required                                             |
| Deadline      | Optional                                             |
| Progress      | System-calculated from contributions and withdrawals |
| Status        | Active, Completed, or Archived                       |

#### Contribution and Withdrawal Rules

1. Users may add dated contributions with an optional note.
2. Users may withdraw no more than the current saved amount.
3. Progress equals total contributions minus total withdrawals.
4. Contributions and withdrawals are dated records.
5. In shared workspaces, contributions and withdrawals record the acting member.
6. Goal contributions do not change wallet balances.
7. Goal withdrawals do not change wallet balances.
8. Goal contributions and withdrawals do not create ledger transactions.
9. A goal may reach a completed state when saved amount is greater than or equal to target amount.
10. If saved amount exceeds target amount, the goal remains completed and actual saved amount must remain visible.
11. Goal progress may display visual completion capped at 100%, but actual amount must not be hidden.

---

## 4.3 Shared Operations

Shared Operations apply to Team, Business, and Enterprise workspaces.

---

### 4.3.1 Shared Wallets

1. Team Owners may create and manage shared wallets.
2. Business and Enterprise Admins may create and manage shared wallets.
3. Active members may view shared wallet balances according to role.
4. Shared wallets belong to the workspace, not to an individual member.
5. Shared wallet transactions affect workspace balances and shared reports.
6. Shared wallets must not include personal wallets from a member’s Single-User workspace.
7. Shared wallet currency rules follow the Core Ledger wallet rules.

---

### 4.3.2 Shared Transactions

#### Attribution Requirements

Every shared transaction must record:

1. Creator.
2. Payer, where applicable.
3. Transaction currency.
4. Transaction date.
5. Shared wallet.
6. Category.
7. Amount.
8. Allocation among members, where applicable.
9. Optional receipt attachment.
10. Optional note.

#### Shared Transaction Rules

1. Editors may create and update shared transactions in Team workspaces.
2. Owners have the same financial editing capability as Editors and additionally manage workspace settings.
3. Viewers may not create, edit, or delete shared financial records.
4. In Governed workspaces, shared transaction creation and posting follow the approval workflow defined in Section 4.4.
5. Shared income transactions affect wallet balance and shared reports.
6. Shared income transactions do not create member debt allocations by default.
7. Shared expense transactions may create member allocations and affect member balances.

---

### 4.3.3 Expense Splitting

#### Supported Split Methods

| Method     | Definition                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Equal      | The expense is divided equally among selected members.                                                                          |
| Percentage | Each selected member is assigned a percentage. Percentages must total 100%.                                                     |
| Exact      | Each selected member is assigned an exact amount. Amounts must total the transaction amount.                                    |
| Shares     | Each selected member is assigned a weighted share. Amounts are calculated proportionally and must total the transaction amount. |

#### Split Integrity Rules

1. Allocations must equal the transaction amount in the smallest unit of its currency.
2. The system must not save a split expense where allocations do not match the total amount.
3. Equal-split rounding remainders must be distributed deterministically.
4. The default deterministic remainder rule is:
   - assign the remainder to the first participant in stable member order,
   - stable member order is determined by membership creation timestamp, then user identifier.
5. The allocation preview must display each member’s share before confirmation.
6. Any rounding remainder must be visible before confirmation.
7. Users may manually adjust exact shares before confirmation where the interface permits.
8. Split allocations apply to expense transactions.
9. Split allocations do not apply to transfers.
10. Split allocations do not apply to savings-goal contributions.

---

### 4.3.4 Net Member Balances

1. MoneyBag must calculate understandable net balances showing who owes whom.
2. Member balances are calculated separately by currency.
3. For each expense transaction:
   - the payer’s paid amount is credited to the payer,
   - each participant’s allocated share is debited from that participant.
4. For each settlement:
   - the paying member’s balance decreases,
   - the receiving member’s balance increases.
5. A positive member balance means other members owe that member.
6. A negative member balance means that member owes other members.
7. The interface may simplify pairwise obligations into an understandable settlement suggestion.
8. Simplified settlement suggestions must remain mathematically consistent with underlying records.
9. Active members may view balances for their workspace according to role.
10. Member balances must not include personal transactions from members’ Single-User workspaces.

---

### 4.3.5 Settlements

#### Settlement Fields

| Field       | Requirement                                                       |
| ----------- | ----------------------------------------------------------------- |
| From Member | Required. Active member.                                          |
| To Member   | Required. Active member.                                          |
| Amount      | Required. Positive value.                                         |
| Currency    | Required. Must match the applicable outstanding balance currency. |
| Date        | Required                                                          |
| Note        | Optional                                                          |
| Recorded By | System-recorded                                                   |

#### Settlement Rules

1. Team Owners and Editors may record settlements.
2. In Governed workspaces, settlement permissions follow Admin-defined policy. Default: Admin and Manager may record settlements.
3. A settlement represents balance resolution between members.
4. A settlement does not create a wallet transaction.
5. A settlement does not affect wallet balances.
6. A settlement does not rewrite previous expenses.
7. A settlement cannot exceed the applicable outstanding balance.
8. A settlement cannot be recorded between a member and themselves.
9. Settlement history must remain traceable.
10. Settlements are immutable.
11. Corrections must be made by creating a new reversing settlement, not by silently editing the original settlement.
12. Settlement actions must be recorded in workspace activity history.
13. In Governed workspaces, settlement actions must be included in the audit trail.

---

## 4.4 Workflow and Governance

Workflow and Governance applies to Business and Enterprise workspaces. Basic single-level approval is available in Team workspaces where enabled.

---

### 4.4.1 Governed Transaction Lifecycle

#### Expense Transaction States

| State           | Ledger Effect              | Description                                                      |
| --------------- | -------------------------- | ---------------------------------------------------------------- |
| Draft           | None                       | Transaction is being prepared.                                   |
| Submitted       | None                       | Transaction is awaiting approval.                                |
| Approved        | Posted to ledger           | Transaction has received final approval.                         |
| Rejected        | None                       | Transaction was rejected. May be edited and resubmitted.         |
| Paid/Reimbursed | Posted transaction remains | Optional reimbursement status after approval.                    |
| Void            | Reversed/corrected         | Approved transaction has been voided through audited correction. |

#### Governed Expense Rules

1. Expense transactions created by Submitters begin in Draft state.
2. Draft transactions do not affect wallet balances, budgets, reports, or member balances.
3. Submitted transactions do not affect wallet balances, budgets, reports, or member balances until approved.
4. Approved transactions are posted to the ledger.
5. Rejected transactions do not post to the ledger.
6. Approved transactions cannot be hard-deleted.
7. Approved transactions may be voided by an Admin.
8. Voiding must create an audited correction.
9. Admins may create transactions that post without approval only where explicitly permitted by workspace policy.
10. All approval exceptions must be audited.

#### Team Approval Behavior

1. Team workspaces support single-level approval.
2. Approval is optional in Team workspaces.
3. In Small Team context, approval is enabled by default.
4. In Household context, approval is disabled by default.
5. The Owner may enable or disable “Require approval for shared expenses.”
6. When approval is disabled, permitted shared transactions post immediately.
7. When approval is enabled, shared expense transactions require Owner approval before posting.

---

### 4.4.2 Approval Routing

#### Single-Level Approval

1. A submitted transaction is approved or rejected by one authorized approver.
2. In Team workspaces, the Owner is the default approver.
3. In Governed workspaces, Admins and Managers may approve according to scope.

#### Multi-Level Approval

1. Business and Enterprise workspaces may configure multi-level approval chains.
2. Approval chains may be based on:
   - amount threshold,
   - department,
   - project,
   - category,
   - member role.
3. A transaction must receive all required approvals before posting.
4. Approval routing must display the current approval level and pending approver.
5. If an approver rejects a transaction, the transaction returns to Rejected state.
6. Rejection requires a reason.
7. Approval requires explicit confirmation.
8. Approval comments are optional but recommended.

#### Self-Approval Rules

1. By default, a user cannot approve their own submission.
2. Enterprise workspaces may configure controlled exceptions through policy.
3. Any self-approval exception must be audited.

#### Approval Audit Requirements

Every approval action must record:

1. Actor.
2. Timestamp.
3. Action: approve, reject, reassign, withdraw, or void.
4. Transaction identifier.
5. Approval level.
6. Comment or reason where applicable.

---

### 4.4.3 Reimbursement Hub

#### Purpose

The Reimbursement Hub tracks approved expenses that require repayment to a member or employee.

#### Reimbursement Fields

| Field             | Requirement                        |
| ----------------- | ---------------------------------- |
| Member            | Required                           |
| Expense Reference | Required                           |
| Amount            | Required                           |
| Currency          | Required                           |
| Status            | Approved – Unpaid, Scheduled, Paid |
| Payment Date      | Required when marked paid          |
| Payment Method    | Optional                           |
| Payment Reference | Optional                           |
| Recorded By       | System-recorded                    |

#### Reimbursement Rules

1. Only approved expenses may enter the reimbursement pipeline.
2. An expense may be marked as reimbursable by the submitter or by policy.
3. The Reimbursement Hub lists approved reimbursable expenses by member, department, currency, and status.
4. Marking a reimbursement as paid records payment metadata.
5. Marking a reimbursement as paid does not automatically create a wallet transaction.
6. If the organization wants the reimbursement to affect a wallet balance, an Admin must create an appropriate ledger record separately.
7. Reimbursement status changes must be audited.
8. Bulk actions may be used to mark multiple reimbursements as paid.
9. Bulk actions require confirmation and must be idempotent.

---

### 4.4.4 Departments and Projects

1. Business and Enterprise workspaces may create departments and projects.
2. Departments and projects may be active or archived.
3. Transactions may be assigned to a department or project.
4. Budgets may be scoped to a department or project.
5. Managers may be scoped to one or more departments.
6. Department-scoped Managers can approve and view only permitted department data.
7. Archived departments and projects remain available for historical reporting.
8. Transactions assigned to archived departments remain readable.
9. New transactions cannot use archived departments or projects unless reactivated.

---

### 4.4.5 Audit Trail

#### Audit Events

The audit trail must record important workspace actions, including:

1. Transaction creation.
2. Transaction update.
3. Transaction void.
4. Approval.
5. Rejection.
6. Reassignment.
7. Settlement recording.
8. Reimbursement status change.
9. Member invitation.
10. Member removal.
11. Role change.
12. Budget creation/update.
13. Wallet creation/update/archival.
14. Settings changes.
15. API key creation/revocation.
16. Data export.
17. Bulk operations.

#### Audit Record Fields

| Field                 | Requirement                         |
| --------------------- | ----------------------------------- |
| Actor                 | Required                            |
| Timestamp             | Required                            |
| Action                | Required                            |
| Entity Type           | Required                            |
| Entity Identifier     | Required                            |
| Summary of Change     | Required                            |
| IP Address            | Optional, subject to privacy policy |
| Before/After Metadata | Where practical                     |

#### Audit Rules

1. Audit logs must be tamper-evident.
2. Audit logs must not be editable by regular users.
3. Auditor role may view and export audit logs.
4. Admin role may view audit logs.
5. Audit log retention must be at least the active lifetime of the workspace.
6. Enterprise workspaces may configure extended retention subject to contract.
7. Audit logs may be retained separately after workspace deletion where required for legal or security purposes.

---

### 4.4.6 API and Webhooks

#### API Availability

| Tier       | API Access |
| ---------- | ---------- |
| Free       | No         |
| Solo       | No         |
| Team       | No         |
| Business   | Yes        |
| Enterprise | Yes        |

#### API Product Rules

1. API access is workspace-scoped.
2. Admins may create and revoke API keys.
3. API keys must support scoped permissions, including read and write.
4. API keys must display last-used timestamp.
5. API requests must respect tier entitlements and role permissions.
6. API actions must be included in the audit trail where applicable.
7. API rate limits must be enforced.
8. API errors must not expose private data beyond the authorized scope.

#### Webhook Product Rules

1. Webhooks are available in Business and Enterprise workspaces.
2. Webhook events may include:
   - transaction.created,
   - transaction.updated,
   - transaction.approved,
   - transaction.rejected,
   - budget.alert,
   - member.updated,
   - invoice.updated,
   - reimbursement.updated.
3. Webhook endpoints must use HTTPS.
4. Webhook payloads must include event type, workspace identifier, timestamp, and event data.
5. Webhook signatures must be provided for payload verification.
6. Failed webhook deliveries must be retried according to a defined retry policy.
7. Webhook delivery failure must not corrupt ledger state.

---

## 4.5 Document, Tax, and Business Tools

---

### 4.5.1 Receipt and File Attachments

#### Availability

| Tier           | Attachments |
| -------------- | ----------- |
| Free           | No          |
| Solo and above | Yes         |

#### Attachment Rules

1. Receipts may be attached to transactions.
2. Supported file types must include JPEG, PNG, and PDF.
3. The system may define a maximum file size. Recommended default: 10 MB per file.
4. Uploaded files must be validated before storage.
5. Uploaded files must be scanned or checked according to available security controls.
6. Attachments are private to the workspace.
7. Attachments are deleted with the transaction unless legal retention requires otherwise.
8. In Governed workspaces, attachment deletion is audited.

---

### 4.5.2 Receipt OCR

#### Availability

| Tier       | OCR |
| ---------- | --- |
| Free       | No  |
| Solo       | No  |
| Team       | No  |
| Business   | Yes |
| Enterprise | Yes |

#### OCR Rules

1. OCR may extract suggested values from receipt images.
2. Suggested fields may include:
   - vendor,
   - date,
   - amount,
   - currency.
3. OCR suggestions are not authoritative.
4. The user must review and confirm OCR-suggested values before they are saved to a transaction.
5. OCR failure must not block manual transaction entry.
6. OCR confidence indicators should be shown where available.
7. Original receipt files remain the source evidence.

---

### 4.5.3 Invoices

#### Availability

| Tier           | Invoice Creation |
| -------------- | ---------------- |
| Free           | No               |
| Solo and above | Yes              |

#### Invoice Fields

| Field          | Requirement                                      |
| -------------- | ------------------------------------------------ |
| Invoice Number | Required. May be auto-generated or manual.       |
| Client Name    | Required                                         |
| Client Email   | Optional                                         |
| Issue Date     | Required                                         |
| Due Date       | Optional                                         |
| Currency       | Required                                         |
| Line Items     | Required. At least one.                          |
| Tax            | Optional                                         |
| Discount       | Optional                                         |
| Notes          | Optional                                         |
| Status         | Draft, Sent, Partially Paid, Paid, Overdue, Void |

#### Invoice Rules

1. An invoice is a business document and payment tracker.
2. An invoice does not affect wallet balances by itself.
3. Recording an invoice payment may optionally create a linked income transaction.
4. If a linked income transaction is created, the invoice status must reflect the payment.
5. If the linked income transaction is deleted or voided, the invoice status must revert or display an unresolved payment state.
6. Invoice numbers must be unique within the workspace or follow a user-defined sequence.
7. Invoices may be exported as PDF.
8. Void invoices remain readable and must not be silently deleted.
9. In Governed workspaces, invoice actions may be audited according to workspace policy.

---

### 4.5.4 Tax Summary and Profit & Loss

#### Tax Category Rules

1. Categories in Business context may carry tax treatment flags.
2. Supported tax treatments:
   - deductible expense,
   - non-deductible expense,
   - taxable income,
   - non-taxable income,
   - ignored for tax summary.
3. Users may configure tax treatment per category.
4. Tax summary reports aggregate amounts by tax treatment.
5. Tax summary reports do not provide tax advice.
6. Tax summary reports must identify date range, timezone, and currency scope.

#### Profit & Loss Rules

1. Profit and loss reports are available in Business context and Governed workspaces.
2. P&L calculates income minus expenses for the selected period.
3. P&L may be filtered by:
   - client,
   - project,
   - department,
   - category,
   - currency.
4. Multi-currency P&L must not combine currencies into one converted total.
5. P&L exports must include metadata: workspace, date range, timezone, currency, and generated timestamp.

---

### 4.5.5 Accountant and Advisor Access

1. Solo, Team, Business, and Enterprise workspaces may provide read-only external access.
2. External access is governed by Section 2 delegation rules.
3. Accountant access in a Solo workspace exposes Business context data only.
4. Accountant access must not expose Personal context data unless explicitly permitted by the user.
5. External advisors cannot create, edit, delete, approve, or export unless explicitly granted by policy.
6. External access is time-limited and revocable.
7. External access events must be audited.

---

## 4.6 Reporting and Analytics

---

### 4.6.1 Common Reporting Rules

1. Reports are workspace-scoped.
2. Reports must respect the user’s role and permissions.
3. Reports must identify:
   - date range,
   - timezone,
   - currency scope,
   - workspace,
   - generated timestamp.
4. Reports must not combine different currencies into one misleading total.
5. Multi-currency results must be grouped or separated by currency.
6. Transfers must be excluded from income and expense totals.
7. Draft and rejected transactions must be excluded from posted financial reports.
8. Voided transactions must be reflected as corrections or excluded according to report type, with clear labeling.
9. Large reports must support pagination or asynchronous generation where necessary.
10. Report exports must respect the same permission scope as the on-screen report.

---

### 4.6.2 Free Report Entitlements

Free users receive:

1. Current-month income total.
2. Current-month expense total.
3. Current-month net result.
4. Current-month category breakdown.
5. No file export.
6. No yearly reports.
7. No custom period reports.
8. No trend comparisons.

---

### 4.6.3 Solo Report Entitlements

Solo users receive:

1. Monthly reports.
2. Yearly reports.
3. Custom date-range reports.
4. Category breakdown.
5. Income and expense trends.
6. Period comparisons.
7. Budget vs actual reports.
8. Tax summary in Business context.
9. Profit and loss in Business context.
10. PDF and CSV exports.

---

### 4.6.4 Team Report Entitlements

Team workspaces receive:

1. All applicable Solo-level financial reports within the shared workspace.
2. Shared income and expense totals.
3. Shared category breakdown.
4. Member contribution summary.
5. Split expense summary.
6. Net member balance report.
7. Settlement history report.
8. Shared budget performance.
9. PDF and CSV exports.

---

### 4.6.5 Business and Enterprise Report Entitlements

Business and Enterprise workspaces receive:

1. All applicable Team-level reports.
2. Departmental spending reports.
3. Project spending reports.
4. Approval status reports.
5. Reimbursement summary reports.
6. Audit trail exports.
7. Tax summary reports.
8. Profit and loss reports by department, project, or client.
9. Budget vs actual reports by department or project.
10. Entity-level reports for Enterprise workspaces.
11. Consolidated entity reporting for Enterprise workspaces.
12. PDF and CSV exports.

---

### 4.6.6 Export Requirements

1. CSV exports must include column headers.
2. CSV exports must use a stable, machine-readable format.
3. PDF exports must include report metadata.
4. Exports must include the user who generated the export where audit applies.
5. Exports must not include data outside the user’s permitted scope.
6. Export generation must not corrupt or lock financial records.
7. Export failures must provide a clear error message and safe retry path.

---

## Section 5: User Experience (UX) & Interaction Design

This section defines how MoneyBag must behave as a user-facing product. It covers navigation, dashboards, core journeys, system states, forms, accessibility, localization, and feedback patterns.

The UX must make financial state, permissions, limits, and consequences explicit. Users must never be uncertain about whether a record was saved, whether a payment succeeded, whether a workspace is read-only, or whether they have permission to perform an action.

---

### 5.1 UX Principles

1. **Clarity over decoration.**
   Financial data must be easy to read, compare, and verify.

2. **Visible state.**
   The system must clearly show loading, saved, failed, read-only, suspended, trial, paywall, and permission-denied states.

3. **Explicit consequences.**
   Destructive or billing-related actions must display the result before confirmation.

4. **No hidden financial changes.**
   Actions that affect balances, budgets, approvals, settlements, or subscriptions must be confirmable and traceable.

5. **Permission transparency.**
   If a user cannot perform an action, the interface must explain why and indicate which role or workspace setting prevents it.

6. **Safe failure.**
   Errors must not expose sensitive account details or internal system information.

7. **Progressive disclosure.**
   Simple users see simple controls. Advanced features appear only when the tier, workspace type, and role require them.

8. **Responsive by default.**
   All Core Release workflows must work on mobile, tablet, and desktop web browsers.

9. **Accessibility is mandatory.**
   Core workflows must be usable with keyboard, screen reader, and assistive technologies.

10. **No dark patterns.**
    Upgrade prompts, trial notices, cancellation flows, and billing confirmations must be honest, clear, and reversible.

---

### 5.2 Information Architecture

MoneyBag’s application shell must separate global account concerns from workspace-specific financial work.

#### 5.2.1 Global Areas

| Area                | Purpose                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Account Menu        | Profile, security, preferences, billing overview, workspace list, logout                 |
| Workspace Switcher  | Move between personal, shared, and governed workspaces                                   |
| Notification Center | In-app notifications and alerts                                                          |
| Help / Support      | Contextual help, contact support, documentation                                          |
| Admin Console       | Restricted to authorized Administrators. Not visible to regular users unless authorized. |

#### 5.2.2 Workspace Navigation

Workspace navigation must adapt to workspace type and role.

| Section              | Free Single-User | Solo Single-User |           Team Shared | Business Governed | Enterprise Governed |
| -------------------- | ---------------: | ---------------: | --------------------: | ----------------: | ------------------: |
| Dashboard            |              Yes |              Yes |                   Yes |               Yes |                 Yes |
| Transactions         |              Yes |              Yes |                   Yes |               Yes |                 Yes |
| Wallets              |              Yes |              Yes |                   Yes |               Yes |                 Yes |
| Budgets              |              Yes |              Yes |                   Yes |               Yes |                 Yes |
| Goals                |              Yes |              Yes |                   Yes |               Yes |                 Yes |
| Reports              |            Basic |             Full |                  Full | Full + governance |       Full + entity |
| Invoices             |               No |              Yes |                   Yes |               Yes |                 Yes |
| Receipts             |               No |              Yes |                   Yes |               Yes |                 Yes |
| Shared Balances      |               No |               No |                   Yes |               Yes |                 Yes |
| Approvals            |               No |               No | Optional single-level |               Yes |                 Yes |
| Reimbursements       |               No |               No |                 Basic |               Yes |                 Yes |
| Departments/Projects |               No |               No |                    No |               Yes |                 Yes |
| Audit Trail          |               No |               No |                    No |               Yes |                 Yes |
| API/Webhooks         |               No |               No |                    No |               Yes |                 Yes |
| Workspace Settings   |          Limited |          Limited |                 Owner |             Admin |               Admin |
| Billing              |             User |             User |                 Owner |             Admin |      Admin/contract |

---

### 5.3 Navigation and Workspace Context

#### 5.3.1 Workspace Switcher

1. The workspace switcher must display the workspace name, workspace type, and current tier.
2. A user with multiple workspaces must be able to switch without logging out.
3. Switching workspaces must not leak data from one workspace into another.
4. The active workspace must always be visible in the application header.
5. If a workspace is suspended, read-only, or trialing, that state must be visible in the workspace switcher.

#### 5.3.2 Context Switcher

Where applicable, the context switcher changes the operational view inside a workspace.

| Workspace Type      | Context Switcher                                                               |
| ------------------- | ------------------------------------------------------------------------------ |
| Free Single-User    | No switcher                                                                    |
| Solo Single-User    | Personal ↔ Business                                                            |
| Team Shared         | Household ↔ Small Team                                                         |
| Business Governed   | Fixed organization context                                                     |
| Enterprise Governed | Fixed organization context, plus entity selector where multiple entities exist |

#### Context Switching Rules

1. Context switching must not create a new workspace.
2. Context switching must not delete or hide data permanently.
3. Context switching changes dashboard layout, default categories, terminology, and filters.
4. The active context must be clearly displayed.
5. If a context requires a higher tier, the interface must display a clear upgrade prompt without blocking access to permitted areas.

#### Context Toggle Strict Isolation Rule

The Solo "Personal ↔ Business" context toggle is strictly scoped to the Single-User workspace UI layer.

- Switching to a Team, Business, or Enterprise workspace via the global Workspace Switcher completely resets the UI context to that target workspace's native state.
- The Solo context toggle state does not persist across workspaces, nor does it affect the data visibility or UI layout of Shared/Governed workspaces.

---

### 5.4 Context-Aware Dashboards

Each workspace context must provide a dashboard appropriate to the user’s financial mode.

---

#### 5.4.1 Free Personal Dashboard

**Primary purpose:** Understand current personal financial position.

**Widgets:**

1. Current balance for the single wallet.
2. Current-month income.
3. Current-month expenses.
4. Current-month net result.
5. Active budget progress.
6. Active savings-goal progress.
7. Recent transactions.
8. Free limit usage indicator.

**Primary actions:**

- Add transaction.
- View budget.
- View goal.
- Upgrade to Solo.

---

#### 5.4.2 Solo Personal Dashboard

**Primary purpose:** Manage complete personal finance.

**Widgets:**

1. Total balance grouped by currency.
2. Period income, expense, and net result.
3. Budget progress.
4. Savings-goal progress.
5. Upcoming recurring transactions.
6. Recent transactions.
7. Spending category breakdown.
8. Cash flow forecast where available.

**Primary actions:**

- Add transaction.
- Add transfer.
- Create budget.
- Create goal.
- Import CSV.
- View reports.

---

#### 5.4.3 Solo Business Dashboard

**Primary purpose:** Track freelance or solo business finance separately from personal finance.

**Widgets:**

1. Business balance grouped by currency.
2. Business income and expenses for selected period.
3. Profit and loss summary.
4. Tax-deductible expense summary.
5. Outstanding invoices.
6. Recent business transactions.
7. Client/project spending summary.
8. Receipt count or missing-receipt alerts where available.

**Primary actions:**

- Add business transaction.
- Create invoice.
- Attach receipt.
- View tax summary.
- View profit and loss.
- Share accountant access.

---

#### 5.4.4 Team Household Dashboard

**Primary purpose:** Understand shared household money and member balances.

**Widgets:**

1. Shared wallet balances grouped by currency.
2. Shared income and expenses for selected period.
3. Net member balances.
4. Recent shared transactions.
5. Shared budget progress.
6. Shared savings-goal progress.
7. Pending settlements or simplified settlement suggestions.

**Primary actions:**

- Add shared expense.
- Split expense.
- Record settlement.
- View balances.
- View shared budget.

**Language style:**

- Use household-friendly terms: “Split bill,” “Settle up,” “Shared budget.”
- Avoid corporate terminology unless the workspace is in Small Team context.

---

#### 5.4.5 Team Small Team Dashboard

**Primary purpose:** Track small-team spending and simple approvals.

**Widgets:**

1. Shared wallet balances.
2. Team expenses for selected period.
3. Pending approvals.
4. Reimbursement status summary.
5. Project or category spending.
6. Recent shared transactions.
7. Member contribution summary.

**Primary actions:**

- Submit expense.
- Approve or reject pending expense.
- Record reimbursement.
- View shared budget.
- View reports.

---

#### 5.4.6 Business Dashboard

**Primary purpose:** Provide organizational expense control.

**Widgets:**

1. Organization balances grouped by currency.
2. Spend for selected period.
3. Budget vs actual summary.
4. Pending approvals.
5. Reimbursements awaiting payment.
6. Department or project spending.
7. Recent transactions.
8. Audit or policy alerts where available.

**Primary actions:**

- Create expense draft.
- Review approvals.
- Manage reimbursements.
- View departmental budgets.
- Export reports.
- View audit trail.

---

#### 5.4.7 Enterprise Dashboard

**Primary purpose:** Provide multi-entity and governance visibility.

**Widgets:**

1. Entity selector.
2. Consolidated balance summary by currency.
3. Entity-level spend summary.
4. Pending approvals across entities.
5. Budget variance.
6. Reimbursement pipeline.
7. Audit activity summary.
8. Compliance-related alerts where available.

**Primary actions:**

- Switch entity.
- Review approvals.
- Export consolidated reports.
- Manage entities, subject to permission.
- View audit logs.

---

### 5.5 Core User Journeys

---

#### 5.5.1 First-Time Registration and Onboarding

**Goal:** Create an account, establish a default workspace, and record the first financial action with minimal friction.

**Flow:**

1. User lands on registration screen.
2. User selects registration method:
   - Email + password,
   - Google OAuth,
   - Apple OAuth.
3. If email + password is used, the user verifies the email address.
4. If OAuth is used, the system validates the provider response and completes account creation.
5. The user enters or confirms basic profile information:
   - display name,
   - preferred currency,
   - timezone,
   - theme preference.
6. The system creates a Free Single-User workspace.
7. Onboarding asks the user’s primary intent:
   - Personal finance,
   - Freelance or solo business,
   - Family or household sharing,
   - Team or company expense management.
8. Based on intent:
   - **Personal finance:** Continue with Free Single-User workspace.
   - **Freelance or solo business:** Prompt Solo trial. User may start trial or continue with Free.
   - **Family or household sharing:** Prompt Team workspace trial. User may start trial or continue with Free personal workspace.
   - **Team or company:** Prompt Business workspace trial. User may start trial or continue with Free personal workspace.
9. The user creates or identifies a first wallet.
10. The user may optionally record a first transaction.
11. The user completes onboarding and reaches the appropriate dashboard.

**Rules:**

1. Onboarding must not create a paid subscription without explicit confirmation.
2. Onboarding must not require a payment card for trial activation.
3. Interrupted onboarding must resume without duplicating saved records.
4. If a workspace or wallet already exists, onboarding must reuse it rather than create duplicates.
5. The user may skip optional steps.

#### Apple Private Relay Email UX Handling

If a user registers via Apple OAuth and the system detects an Apple private relay email address (e.g., `@privaterelay.appleid.com`), the onboarding flow must trigger a secondary, optional prompt: _"To ensure you receive critical billing and security alerts, please add and verify a primary email address."_

- The user may skip this step to reduce friction.
- However, a persistent, dismissible warning banner must remain visible in their Global Account Settings until a standard, non-relay email address is verified.

---

#### 5.5.2 Add Transaction

**Goal:** Record income, expense, or refund quickly and accurately.

**Flow:**

1. User selects “Add Transaction” from dashboard, transaction list, or quick action.
2. User selects transaction type:
   - Income,
   - Expense,
   - Expense refund/reversal.
3. User enters amount.
4. User selects wallet.
5. User selects category.
6. User selects date.
7. User optionally adds description, note, tags, receipt, client/project, or department.
8. System validates inputs.
9. User confirms.
10. System saves transaction and updates balances, budgets, and reports.
11. System displays success feedback.

**UX Requirements:**

1. Amount input must display currency clearly.
2. The default wallet should be preselected.
3. The default date should be today in the workspace timezone.
4. Category options must match the selected transaction type.
5. If a Free limit is reached, the system must block saving and show an upgrade prompt.
6. If the workspace is read-only, the form must be disabled and the reason displayed.
7. Duplicate submission must be prevented.

---

#### 5.5.3 Transfer Between Wallets

**Goal:** Move money between two wallets without affecting income or expense.

**Flow:**

1. User selects “Transfer.”
2. User selects source wallet.
3. User selects destination wallet.
4. System verifies that both wallets use the same currency.
5. User enters amount.
6. User selects date.
7. User optionally adds note.
8. System displays a preview showing source deduction and destination addition.
9. User confirms.
10. System creates the transfer atomically.
11. System displays success feedback.

**UX Requirements:**

1. Transfers must be visually distinct from income and expense.
2. The interface must prevent selecting the same wallet as source and destination.
3. If wallets use different currencies, the system must block the transfer and explain the limitation.
4. If a wallet is archived, it cannot be selected for a new transfer.

---

#### 5.5.4 Create and Track Budget

**Goal:** Set a spending limit and monitor progress.

**Flow:**

1. User selects “Create Budget.”
2. User chooses budget scope:
   - overall,
   - category-specific.
3. User selects currency.
4. User selects period:
   - monthly,
   - yearly.
5. User enters limit amount.
6. User optionally enables alert threshold and rollover.
7. System validates active budget limits.
8. User confirms.
9. Dashboard displays budget progress.

**UX Requirements:**

1. Budget progress must show limit, spent, remaining, and percentage.
2. Over-budget states must be clearly labeled and not communicated by color alone.
3. If a Free user reaches the active budget limit, creation is blocked with an upgrade prompt.
4. Archived budgets must be visually distinguishable from active budgets.

---

#### 5.5.5 Split Expense in Team Workspace

**Goal:** Record a shared expense and allocate it fairly among members.

**Flow:**

1. Editor or Owner selects “Add Shared Expense.”
2. User enters amount, wallet, category, date, and description.
3. User selects payer.
4. User selects split method:
   - Equal,
   - Percentage,
   - Exact,
   - Shares.
5. User selects participating members.
6. System calculates allocations.
7. System displays allocation preview.
8. If rounding creates a remainder, the system shows which member receives the remainder.
9. User may adjust exact allocations where permitted.
10. User confirms.
11. System saves the shared expense and updates member balances.

**UX Requirements:**

1. Allocation preview must display each member’s share.
2. The sum of allocations must equal the transaction amount before confirmation.
3. Rounding differences must be visible.
4. The payer must be clearly displayed.
5. Viewer role must not see the creation form.

---

#### 5.5.6 Record Settlement

**Goal:** Resolve outstanding member balances.

**Flow:**

1. User opens Balances or Settlements screen.
2. System displays net balances by currency.
3. User selects “Record Settlement.”
4. User selects paying member and receiving member.
5. System displays applicable outstanding balance.
6. User enters settlement amount.
7. System validates that the amount does not exceed the applicable outstanding balance.
8. User optionally adds note.
9. User confirms.
10. System records settlement and updates balances.

**UX Requirements:**

1. Settlement history must be accessible.
2. Settlements must be visually distinct from expense transactions.
3. The interface must make clear that settlements do not create wallet transactions.
4. Corrections must be made through a reversing settlement, not by editing the original settlement.

---

#### 5.5.7 Submit Expense for Approval

**Goal:** Allow a Submitter to request approval for a business expense.

**Flow:**

1. Submitter selects “Create Expense.”
2. Transaction is created in Draft state.
3. Submitter enters amount, wallet, category, date, description, and optional receipt.
4. Submitter selects department or project where required.
5. Submitter reviews the draft.
6. Submitter selects “Submit for Approval.”
7. System changes state to Submitted.
8. Appropriate approver receives notification or sees the item in the approval queue.

**UX Requirements:**

1. Draft transactions must be clearly labeled.
2. Submitted transactions must not be editable unless returned to Draft or rejected.
3. The Submitter must see the current approval status.
4. If approval is pending, the interface must show who needs to act.

5. After submission, the expense must display a “Pending Approval” state.
6. A submitted expense must not appear as posted in ledger balances, budgets, reports, or member balances until final approval is received.
7. The submitter must see the current approver or approval level where applicable.
8. If approval is required, the interface must clearly state that the transaction will affect financial totals only after final approval.
9. If a submitted expense is rejected, the interface must display the rejection reason and provide a clear path to edit and resubmit.

---

#### 5.5.8 Approve or Reject Expense

**Goal:** Allow an authorized approver to review and decide on a submitted expense.

**Flow:**

1. Approver opens approval queue.
2. Approver selects submitted expense.
3. System displays:
   - submitter,
   - amount,
   - currency,
   - category,
   - department/project,
   - date,
   - receipt,
   - policy information where available.
4. Approver selects Approve or Reject.
5. If rejecting, approver enters a reason.
6. System records the decision and updates transaction state.
7. System notifies the submitter.

**UX Requirements:**

1. Approver cannot approve their own submission by default.
2. Approval actions must require confirmation.
3. Rejection reason must be visible to the submitter.
4. Multi-level approvals must show current level and remaining approvers.
5. Approval decisions must be audited.

---

#### 5.5.9 Upgrade from Free to Paid

**Goal:** Allow a user to upgrade when they reach a limit or need a higher capability.

**Flow:**

1. User encounters a limit or locked feature.
2. System displays a clear explanation of the limitation.
3. System displays relevant plan benefits.
4. User selects upgrade.
5. System displays checkout summary:
   - plan,
   - workspace,
   - billing cadence,
   - price,
   - tax,
   - total,
   - renewal behavior,
   - cancellation policy.
6. User confirms payment.
7. System activates the subscription immediately upon success.
8. System displays success confirmation and returns the user to the original workflow.

**UX Requirements:**

1. Upgrade prompts must not block unrelated navigation unnecessarily.
2. Upgrade screens must disclose all costs before confirmation.
3. Failed payment must show a clear error and safe retry path.
4. Successful upgrade must restore the user’s intended action where possible.

---

#### 5.5.10 Trial Expiration

**Goal:** Inform users before trial access ends and explain the result.

**Flow:**

1. System sends trial-ending reminder at least 24 hours before expiration.
2. In-app banner displays trial end date and time remaining.
3. User may upgrade before expiration.
4. If trial expires:
   - Solo trial downgrades to Free.
   - Team trial workspace becomes read-only.
   - Business trial workspace becomes read-only.
5. The workspace displays a clear state banner.
6. Owner/Admin may export data or reactivate within the retention period.

**UX Requirements:**

1. Trial status must be visible in workspace settings and billing overview.
2. Trial expiration must not happen silently.
3. Read-only workspaces must show export and reactivation paths.
4. Users must not be charged automatically at trial end.

---

#### 5.5.11 Cancellation

**Goal:** Allow a user to cancel a subscription without confusion or hidden consequences.

**Flow:**

1. Billing manager opens billing settings.
2. User selects cancel subscription.
3. System displays:
   - effective cancellation date,
   - remaining access period,
   - resulting workspace state,
   - data retention period,
   - export options.
4. User confirms cancellation.
5. System records cancellation and prevents renewal.
6. System displays confirmation.

**UX Requirements:**

1. Cancellation flow must not use confusing language.
2. Cancellation must not immediately delete data.
3. The user must understand whether the workspace becomes Free, read-only, or suspended.
4. The cancellation confirmation screen must provide a clear path to export data.

---

### 5.6 Forms, Validation, and Confirmation

#### 5.6.1 Form Requirements

1. Every form control must have a clear label.
2. Required fields must be identified.
3. Optional fields should be labeled as optional where helpful.
4. Inline help must be available for financially significant fields.
5. Forms must preserve user input where possible after validation failure.
6. Currency amount fields must display the currency code or symbol.
7. Date fields must use a predictable date picker.
8. Timezone-sensitive forms must display the applicable timezone where relevant.

#### 5.6.2 Validation Rules

1. Validation errors must appear near the affected field.
2. Error messages must explain what is wrong and how to fix it.
3. System errors must not expose stack traces, database details, or internal identifiers.
4. Validation must occur on both client and server.
5. Financial mutations must not rely only on client-side validation.
6. If a form is invalid, submission must be blocked and focus should move to the first error.

#### 5.6.3 Confirmation Dialogs

Confirmation is required for:

1. Deleting a wallet.
2. Deleting a transaction where permitted.
3. Voiding an approved transaction.
4. Deleting a recurring template.
5. Recording irreversible settlement corrections.
6. Removing a member.
7. Changing a member role.
8. Deleting a workspace.
9. Canceling a subscription.
10. Issuing refunds in Admin Console.
11. Manual entitlement changes in Admin Console.
12. Bulk financial operations.

#### Confirmation Content

Each confirmation must display:

1. Action being performed.
2. Affected entity or entities.
3. Consequences.
4. Whether the action is reversible.
5. Required acknowledgment, where applicable.

For high-risk destructive actions, the system may require typed confirmation, such as entering the workspace name.

---

### 5.7 System States

MoneyBag must provide meaningful states for data-driven experiences.

---

#### 5.7.1 Loading State

1. Critical content must load before optional heavy charts or advanced panels.
2. Skeleton loaders or equivalent loading indicators must be used for asynchronous content.
3. Buttons that trigger mutations must show pending state during submission.
4. Long-running exports or report generation must display progress or an asynchronous status.

---

#### 5.7.2 Empty State

Empty states must be actionable.

| Area           | Empty State Message Direction                       |
| -------------- | --------------------------------------------------- |
| Wallets        | Create first wallet                                 |
| Transactions   | Add first transaction or import CSV where available |
| Budgets        | Create first budget                                 |
| Goals          | Create first savings goal                           |
| Invoices       | Create first invoice                                |
| Approvals      | No pending approvals                                |
| Reimbursements | No reimbursements awaiting action                   |
| Reports        | No data for selected filters/date range             |
| Notifications  | No notifications                                    |

Empty states must not display misleading sample financial data unless clearly labeled as sample content.

---

#### 5.7.3 Error State

1. Errors must be visible and specific enough to allow correction.
2. Network errors must provide retry where safe.
3. Validation errors must not clear unrelated form data.
4. Server errors must display a safe message and, where useful, an error reference identifier.
5. Failed financial mutations must clearly indicate that no record was saved or that the system preserved prior state.
6. If an operation partially fails, the system must recover to a consistent state or display an actionable support message.

---

#### 5.7.4 Permission-Denied State

1. If a user lacks permission, the interface must deny access safely.
2. The message must explain the required role or permission where appropriate.
3. The interface must not expose data the user is not authorized to view.
4. If an action requires Owner/Admin approval, the user should see who can grant access where practical.

---

#### 5.7.5 Success State

1. Successful creation, update, deletion, approval, payment, or export must provide clear feedback.
2. Success messages should be brief and non-intrusive.
3. Where the action changes financial state, the updated state should be visible immediately or clearly queued.
4. Success feedback must not imply completion before the server confirms the mutation.

---

#### 5.7.6 Read-Only and Suspended State

1. Suspended or read-only workspaces must display a persistent banner.
2. The banner must explain:
   - why the workspace is read-only,
   - what actions remain available,
   - how to restore access,
   - data retention deadline where applicable.
3. Creation, editing, deletion, invitations, approvals, and billing changes must be disabled.
4. Export and view actions must remain available where policy permits.
5. Disabled controls must explain why they are disabled.

6. The read-only banner must display the retention deadline where applicable.
7. The banner must provide direct actions for:
   - export data, where permitted,
   - restore access or reactivate subscription, where permitted,
   - contact support.
8. Disabled controls in read-only mode must display a tooltip or helper text explaining that the workspace is suspended or read-only.
9. The read-only banner must remain visible on all workspace pages until the workspace is reactivated, deleted, or the retention period expires.
10. The system must not display creation forms as editable in a read-only workspace unless the form is intentionally provided for support or export purposes.

---

#### 5.7.7 Paywall and Limit State

1. When a user reaches a plan limit, the interface must show:
   - current usage,
   - applicable limit,
   - blocked action,
   - upgrade option.
2. Paywalls must not pretend that an action succeeded.
3. Paywalls must not obscure existing data.
4. Users must be able to dismiss upgrade prompts without losing current work where possible.
5. Free limit usage should be visible in settings or billing overview.

---

### 5.8 Tables, Lists, and Financial Views

1. Transaction lists must support pagination or virtualized loading.
2. Tables must display column headers clearly.
3. Amount columns must align consistently.
4. Negative values must be displayed with clear notation.
5. Currency must be visible for every amount.
6. Multi-currency lists must separate or label rows by currency.
7. Filters must show active filter state.
8. Users must be able to clear all filters easily.
9. Long tables must remain usable on narrow screens.
10. On narrow screens, complex tables may transform into card-based layouts while preserving essential fields.
11. Financial summaries must distinguish between posted, pending, draft, and read-only records.

12. Dashboards and financial summaries must not combine different currencies into one total.
13. Multi-currency balances must be displayed as separate currency cards, grouped rows, or clearly separated sections.
14. If a user selects a preferred display currency, the interface may use it for labeling, but must not imply a converted total unless an approved currency conversion feature exists.
15. Charts and reports involving multiple currencies must either:

- allow filtering by a single currency, or
- display separate visual groups per currency.

---

### 5.9 Responsive Behavior

1. The Core Release must support modern mobile, tablet, and desktop web browsers.
2. Primary actions must be reachable on mobile without excessive scrolling.
3. Navigation may adapt to viewport size.
4. Forms must be usable on touch devices.
5. Tables must support horizontal scrolling or responsive card layouts.
6. Dashboards must prioritize critical financial summaries on small screens.
7. Dialogs and confirmation modals must be usable on narrow viewports.
8. Charts must resize gracefully and remain readable.

---

### 5.10 Accessibility Requirements

#### 5.10.1 Target Standard

MoneyBag targets WCAG 2.2 AA behavior for Core Release workflows.

#### 5.10.2 Keyboard Access

1. Core workflows must be operable with a keyboard.
2. Interactive elements must be reachable in a logical focus order.
3. Focus must be visible.
4. Modal dialogs must trap focus appropriately and return focus when closed.
5. Keyboard shortcuts may be provided but must not be required.
6. Keyboard shortcuts must not conflict with screen reader or browser controls.

#### 5.10.3 Forms and Assistive Technology

1. Inputs must have programmatically associated labels.
2. Error messages must be associated with the relevant field.
3. Required fields must be announced to assistive technology.
4. Dynamic status changes must be announced using appropriate live-region semantics.
5. Instructions must be available where field input is complex.

#### 5.10.4 Visual Accessibility

1. Status must not be communicated through color alone.
2. Icons, text labels, or patterns must accompany color states.
3. Contrast must meet WCAG AA requirements for normal and large text.
4. Charts must provide accessible summaries or data alternatives where practical.
5. Users must be able to zoom text without loss of content or function.

#### 5.10.5 Motion

1. Non-essential animation must respect reduced-motion preferences.
2. Auto-updating content must not create distracting or disorienting movement.
3. Critical status changes may use motion sparingly and must also provide text or icon indication.

---

### 5.11 Localization and Formatting

#### 5.11.1 Locale Preferences

Users may manage:

1. Display name.
2. Preferred currency.
3. Locale.
4. Timezone.
5. Theme.

#### 5.11.2 Formatting Rules

1. Amounts must respect locale formatting while preserving explicit currency.
2. Dates must respect locale formatting.
3. Timezone-sensitive reports must display the timezone used.
4. Currency display may use symbol, code, or both depending on clarity.
5. Where multiple currencies exist, the interface must avoid implying a single combined total.

#### 5.11.3 Language Support

1. Core Release interface language is English unless otherwise decided by product ownership.
2. The frontend architecture must support future localization.
3. User-entered data must not be translated automatically.
4. Financial categories may be localized by display name without changing stored category identity.

---

### 5.12 Theming

1. MoneyBag must support light theme.
2. MoneyBag must support dark theme.
3. MoneyBag must support system theme preference.
4. Theme selection must persist across sessions.
5. All states, charts, tables, and alerts must remain readable in both themes.
6. Theme must not alter financial data or permissions.

---

### 5.13 Notification and Feedback Patterns

#### 5.13.1 In-App Notification Center

1. Users may view their own in-app notifications.
2. Notifications must identify workspace where relevant.
3. Notifications must include timestamp.
4. Required security, billing, and legal notifications cannot be disabled.
5. Optional notification categories may be managed through preferences.

#### 5.13.2 Feedback Types

| Feedback Type      | Use Case                                                       |
| ------------------ | -------------------------------------------------------------- |
| Inline validation  | Field-level errors                                             |
| Toast/message      | Successful or failed action                                    |
| Banner             | Workspace-wide state such as trial, suspension, failed payment |
| Modal confirmation | Destructive or billing-sensitive actions                       |
| Status badge       | Record state such as Draft, Submitted, Approved, Rejected      |
| Empty state        | No records available                                           |
| Progress indicator | Export, import, report generation                              |

#### 5.13.3 Notification Clarity

Notifications must clearly state:

1. What happened.
2. Which workspace or entity is affected.
3. Whether user action is required.
4. Where to take the action.

---

### 5.14 Billing and Subscription Experience

#### 5.14.1 Billing Overview

The billing overview must show:

1. Current plan.
2. Workspace associated with the plan.
3. Billing cadence.
4. Trial status, if applicable.
5. Renewal date.
6. Next invoice estimate, where applicable.
7. Scheduled cancellation or downgrade, if applicable.
8. Payment method status.
9. Billing history and invoices.

#### 5.14.2 Plan Selection

1. Plan comparison must clearly show differences between tiers.
2. The selected workspace must be visible during checkout.
3. Seat-based plans must show current seat count and estimated total.
4. Yearly and monthly switching must update price and renewal disclosure immediately.
5. Trial information must be displayed before activation.

#### 5.14.3 Checkout Requirements

Before confirmation, checkout must display:

1. Plan name.
2. Workspace name.
3. Billing cadence.
4. Amount.
5. Applicable tax.
6. Total.
7. Effective date.
8. Renewal behavior.
9. Cancellation policy.
10. Access consequences.

#### 5.14.4 Checkout Result

1. Successful checkout must clearly communicate the resulting subscription state.
2. Failed checkout must provide a clear error and safe retry path.
3. Canceled checkout must return the user to billing or plan selection without changing the subscription.
4. Duplicate submission must not create duplicate charges.

---

### 5.15 Maintenance and Public Error Experience

1. A publicly reachable maintenance experience must explain temporary unavailability.
2. Maintenance pages must not expose internal system details.
3. Maintenance pages must provide a safe retry path.
4. Public error pages must not expose private account state.
5. Authenticated users affected by maintenance must receive safe guidance.
6. Maintenance states must be communicated clearly and consistently.

---

## Section 6: Platform Architecture, Data & Integrations

This section defines MoneyBag’s product-level platform architecture, logical data model, integration boundaries, API requirements, webhook behavior, and data import/export standards.

This section does not prescribe programming language, framework, cloud provider, database engine, or deployment topology. Those decisions belong to the Backend Specification and Operations Specification.

---

### 6.1 Architectural Principles

1. **Workspace-scoped multi-tenancy.**
   All financial data must be scoped to a workspace unless explicitly defined as global user data.

2. **Trusted-boundary authorization.**
   Authentication and authorization must be enforced by trusted backend boundaries. Client-side visibility alone is not sufficient.

3. **Financial integrity.**
   Ledger mutations must be atomic, idempotent where appropriate, and protected from duplicate submission.

4. **Provider abstraction.**
   External services such as OAuth providers, payment providers, email delivery, file storage, and OCR must be abstracted so that MoneyBag does not depend on a single vendor’s internal behavior.

5. **Separation of billing and ledger.**
   Subscription billing state must not corrupt financial ledger records. Payment events affect entitlements and workspace state, not user-entered financial history.

6. **Failure isolation.**
   A failed optional integration, notification, chart, or secondary service must not prevent access to core financial records.

7. **No card data storage.**
   MoneyBag must not store full payment card numbers, card security codes, or sensitive payment credentials. Payment card data must be handled by the approved payment provider.

8. **Web-first Core Release.**
   The Core Release is a responsive web application. Native mobile apps are out of scope. Progressive Web App capabilities are deferred.

---

### 6.2 Logical Domain Model

The following entities represent the product-level data model. Backend implementation may normalize or extend these entities, but the product behavior must remain consistent.

#### 6.2.1 Identity and Tenancy

| Entity            | Purpose                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| User              | Global account identity. Holds authentication, profile, security settings, and global preferences. |
| ExternalIdentity  | Linked Google or Apple OAuth identity.                                                             |
| Workspace         | Isolated financial environment. May be Single-User, Shared, Governed, or Multi-Entity.             |
| Membership        | Relationship between a User and a Workspace. Contains role and membership status.                  |
| WorkspaceSettings | Workspace timezone, context, feature toggles, formatting defaults, and governance settings.        |
| Role              | Named set of permissions. System roles are predefined. Enterprise may support custom roles.        |

#### 6.2.2 Subscription and Billing

| Entity         | Purpose                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Subscription   | Paid or free entitlement attached to a workspace. Contains plan, cadence, status, trial data, and renewal information.        |
| BillingProfile | Billing payer details, including billing email, company name, tax identifier where supported, and payment provider reference. |
| Invoice        | Record of charge, credit, refund, or billing event.                                                                           |
| PaymentAttempt | Record of payment initiation, success, failure, retry, or dispute.                                                            |
| Coupon         | Promotional code with eligibility, discount type, expiry, and redemption limits.                                              |
| SeatAdjustment | Record of paid seat additions, removals, role changes, and prorated billing effects.                                          |

#### 6.2.3 Core Ledger

| Entity            | Purpose                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| Wallet            | Financial container with currency, opening balance, type, status, and default flag.  |
| Category          | Income or expense classification. May be default or custom.                          |
| Tag               | User-defined label for transactions.                                                 |
| Transaction       | Income, expense, or expense refund/reversal record.                                  |
| Transfer          | Linked movement between two wallets of the same currency.                            |
| RecurringTemplate | Scheduled rule for generating future transactions.                                   |
| ImportBatch       | Record of CSV import attempts, validation results, and resulting transactions.       |
| Attachment        | Uploaded receipt, invoice document, or supporting file linked to a financial record. |

#### 6.2.4 Planning

| Entity       | Purpose                                                 |
| ------------ | ------------------------------------------------------- |
| Budget       | Spending limit for a period, scope, and currency.       |
| BudgetAlert  | Threshold configuration and alert history for a budget. |
| SavingsGoal  | Target amount with progress tracking.                   |
| GoalActivity | Contribution or withdrawal against a savings goal.      |

#### 6.2.5 Shared Operations

| Entity        | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| Allocation    | Member share of a shared expense transaction.                                        |
| MemberBalance | Calculated net position of a member per currency. May be derived rather than stored. |
| Settlement    | Record resolving part or all of a member balance.                                    |

#### 6.2.6 Workflow and Governance

| Entity          | Purpose                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| ApprovalPolicy  | Rules defining when approvals are required.                               |
| ApprovalRule    | Condition such as amount threshold, department, project, or category.     |
| ApprovalRequest | Workflow instance attached to a submitted transaction.                    |
| ApprovalStep    | Individual approver decision within an approval chain.                    |
| Reimbursement   | Payment tracking state for approved reimbursable expenses.                |
| Department      | Organizational unit used for scoping budgets, approvals, and reports.     |
| Project         | Work object used for client/project tracking and reporting.               |
| Client          | Business counterparty used in invoices, projects, and business reporting. |

#### 6.2.7 Documents and Business Tools

| Entity             | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| Invoice            | Business invoice document with line items, tax, discount, and payment status. |
| InvoiceLineItem    | Individual billable item on an invoice.                                       |
| InvoicePayment     | Payment record linked to an invoice and optionally to an income transaction.  |
| TaxCategorySetting | Tax treatment assigned to a category in Business context.                     |

#### 6.2.8 Enterprise Structure

| Entity            | Purpose                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| Entity            | Legal entity, subsidiary, branch, or business unit inside an Enterprise workspace. |
| EntityMembership  | Optional scoping of users to specific entities.                                    |
| ConsolidationRule | Rules for consolidated reporting across entities.                                  |

#### 6.2.9 Observability, Security, and Integration

| Entity                 | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| AuditLog               | Tamper-evident record of sensitive workspace actions.                         |
| Notification           | In-app or email notification record.                                          |
| NotificationPreference | User preference for optional notification categories.                         |
| ApiKey                 | Credential for server-to-server API access in Business/Enterprise workspaces. |
| WebhookEndpoint        | HTTPS endpoint subscribed to workspace events.                                |
| WebhookDelivery        | Delivery attempt, response status, retry state, and failure metadata.         |
| ActivityLog            | Non-audit workspace activity history where full audit is not required.        |

---

### 6.3 Workspace Data Scoping

#### 6.3.1 Global vs Workspace-Scoped Data

| Data Type                       | Scope            |
| ------------------------------- | ---------------- |
| User profile                    | Global           |
| Authentication credentials      | Global           |
| Security settings               | Global           |
| Global notification preferences | Global           |
| Workspace financial data        | Workspace-scoped |
| Workspace members               | Workspace-scoped |
| Workspace roles                 | Workspace-scoped |
| Workspace billing               | Workspace-scoped |
| Workspace settings              | Workspace-scoped |
| Audit logs                      | Workspace-scoped |
| API keys                        | Workspace-scoped |
| Webhooks                        | Workspace-scoped |

#### 6.3.2 Isolation Rules

1. Every workspace-scoped query must be restricted by workspace identifier and valid membership.
2. A user’s personal workspace data must not be visible from a Team, Business, or Enterprise workspace.
3. A Team or Business workspace’s data must not be visible from a user’s personal workspace.
4. A user who belongs to multiple Business workspaces must not be able to query across those workspaces unless explicitly authorized by Enterprise multi-entity rules.
5. Reports, exports, search, notifications, and API responses must respect workspace isolation.
6. Background jobs must operate within workspace scope and must not leak tenant context.

7. Data access layers must enforce workspace scoping automatically for all workspace-scoped entities. Application code must not rely on manually adding workspace filters for every query.
8. Cross-workspace queries are prohibited except for:
   - global user profile data,
   - authentication and session data,
   - billing provider reconciliation,
   - explicitly authorized administrative operations.
9. Background jobs, API endpoints, report generation, exports, file access, and notification dispatch must pass through the same tenant authorization context as the user interface.
10. Any query that attempts to access workspace data without a valid membership and workspace context must fail securely and log the event for security review.

---

### 6.4 Identifier, Timestamp, and State Rules

1. Every persistent entity must have a stable unique identifier.
2. Financial entities must not rely on mutable display fields as identifiers.
3. System timestamps must be stored in UTC.
4. User-facing calendar dates must be stored separately from system timestamps where needed.
5. Workspace timezone must be applied when calculating calendar periods.
6. Financial state changes must be explicit.
7. Governed workspace approved transactions must support void or correction states rather than silent deletion.
8. Archived records must remain queryable for historical reporting unless deleted through an approved deletion policy.
9. State transitions for subscriptions, approvals, reimbursements, invoices, and workspaces must be auditable where applicable.

10. The following lifecycles must be implemented as explicit state machines:
    - subscription lifecycle,
    - workspace lifecycle,
    - transaction approval workflow,
    - reimbursement lifecycle,
    - invoice lifecycle,
    - recurring template lifecycle.
11. State transitions must be validated before execution. Invalid transitions must be rejected and logged.
12. Direct status updates that bypass defined state transition rules are prohibited.
13. Every state transition must record:
    - previous state,
    - new state,
    - actor,
    - timestamp,
    - trigger source,
    - reason where applicable.

---

### 6.5 API Strategy

#### 6.5.1 API Availability

| Tier       | API Access    |
| ---------- | ------------- |
| Free       | Not available |
| Solo       | Not available |
| Team       | Not available |
| Business   | Available     |
| Enterprise | Available     |

#### 6.5.2 API Type

1. The Core Release API must be a REST-style HTTPS API.
2. API access is workspace-scoped.
3. API access is intended for private integrations owned by the workspace.
4. The Core Release does not provide a public developer marketplace or open third-party ecosystem.

#### 6.5.3 Authentication and Authorization

1. API requests must authenticate using an approved mechanism.
2. Session-based authentication may be used for web application requests.
3. API key or token authentication must be used for server-to-server integrations.
4. API keys must be created and revoked by Admins.
5. API keys must support scoped permissions.
6. Recommended scopes:
   - read:ledger,
   - write:ledger,
   - read:reports,
   - read:audit,
   - write:webhooks,
   - read:members,
   - write:members.
7. API requests must enforce the same role and tier permissions as the user interface.
8. API access must be included in audit logging.

#### 6.5.4 API Resources

The API must support authorized access to the following resource families where tier and role permit:

| Resource Family      | Examples                                              |
| -------------------- | ----------------------------------------------------- |
| Workspaces           | List visible workspaces, retrieve workspace settings  |
| Members              | List members, retrieve member role                    |
| Wallets              | Create, retrieve, update, archive                     |
| Categories           | Create, retrieve, update, archive                     |
| Tags                 | Create, retrieve, update, delete                      |
| Transactions         | Create, retrieve, update, void where governed         |
| Transfers            | Create, retrieve                                      |
| Budgets              | Create, retrieve, update, archive                     |
| Goals                | Create, retrieve, update, add contribution/withdrawal |
| Settlements          | Create, retrieve                                      |
| Invoices             | Create, retrieve, update status                       |
| Approvals            | Submit, approve, reject, retrieve status              |
| Reimbursements       | Retrieve, update payment status                       |
| Departments/Projects | Create, retrieve, update, archive                     |
| Reports              | Retrieve report data within permitted scope           |
| Audit Logs           | Retrieve where role permits                           |
| Webhooks             | Create, list, update, delete                          |

#### 6.5.5 API Behavioral Rules

1. API responses must use standard HTTP status codes.
2. API errors must return a structured error object.
3. Error responses must not expose sensitive account state or internal implementation details.
4. List endpoints must support pagination.
5. Cursor-based pagination is preferred for large or changing datasets.
6. List endpoints must support filtering and sorting where practical.
7. Mutating endpoints that create financial records must support idempotency keys.
8. Idempotent replays must return the original result rather than creating duplicates.
9. API rate limits must be enforced.
10. Rate-limited responses must include retry guidance.
11. API actions that modify financial records must be audited.

#### 6.5.6 API Error Structure

API errors should include:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The transaction amount must be greater than zero.",
    "target": "amount",
    "request_id": "req_123456"
  }
}
```

The exact field names may be defined in the OpenAPI contract, but the product requirement is that errors must be machine-readable, safe, and actionable.

---

### 6.6 Webhook Architecture

#### 6.6.1 Availability

| Tier       | Webhooks      |
| ---------- | ------------- |
| Free       | Not available |
| Solo       | Not available |
| Team       | Not available |
| Business   | Available     |
| Enterprise | Available     |

#### 6.6.2 Supported Webhook Events

The Core Release should support events relevant to financial and workflow automation.

| Event                   | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `transaction.created`   | A posted transaction was created.               |
| `transaction.updated`   | A posted transaction was updated.               |
| `transaction.voided`    | A posted transaction was voided.                |
| `transaction.submitted` | A draft transaction was submitted for approval. |
| `transaction.approved`  | A transaction received final approval.          |
| `transaction.rejected`  | A transaction was rejected.                     |
| `budget.alert`          | A budget crossed its configured threshold.      |
| `member.added`          | A member accepted an invitation.                |
| `member.removed`        | A member was removed.                           |
| `member.role_changed`   | A member role changed.                          |
| `reimbursement.updated` | A reimbursement status changed.                 |
| `invoice.updated`       | Invoice status changed.                         |
| `subscription.updated`  | Workspace subscription state changed.           |

#### 6.6.3 Webhook Payload Requirements

Each webhook payload must include:

1. Event identifier.
2. Event type.
3. Event timestamp.
4. Workspace identifier.
5. Entity type and identifier.
6. Event data.
7. Signature-related metadata where required.

#### 6.6.4 Webhook Security and Delivery

1. Webhook endpoints must use HTTPS.
2. Webhook payloads must be signed.
3. The receiving system must be able to verify payload signatures.
4. Webhook delivery may be at-least-once.
5. Consumers must handle duplicate events safely.
6. Event order is not guaranteed unless explicitly defined for a specific event type.
7. Failed deliveries must be retried according to a retry schedule.
8. Recommended retry schedule:
   - immediate retry,
   - 1 minute,
   - 5 minutes,
   - 30 minutes,
   - 2 hours,
   - 12 hours,
   - 24 hours.
9. Persistent failures must be visible in the workspace integration settings.
10. Webhook failure must not corrupt ledger state.
11. Webhook failure must not block a financial mutation unless the workflow explicitly requires delivery confirmation.
12. Admins may disable or delete webhook endpoints.
13. Webhook secret rotation must be supported.

---

### 6.7 Third-Party Integrations

MoneyBag may integrate with external providers where necessary. All external integrations must preserve data isolation, security, and financial integrity.

#### 6.7.1 OAuth Identity Providers

| Provider | Purpose                         |
| -------- | ------------------------------- |
| Google   | Social registration and sign-in |
| Apple    | Social registration and sign-in |

**Requirements:**

1. OAuth flows must use secure redirect handling.
2. Provider tokens must not be exposed to unauthorized clients.
3. Email verification may be trusted only when the provider confirms email ownership.
4. Account linking must require authentication of the existing account when an OAuth email matches an existing MoneyBag account.
5. Apple “Hide My Email” must be handled using Apple’s stable user identifier.
6. Unlinking an OAuth provider must be blocked if no alternative authentication method remains.
7. GitHub OAuth is not supported.

#### 6.7.2 Payment Provider

The payment provider supports subscriptions, trials, seat billing, invoices, refunds, and payment lifecycle events.

**Requirements:**

1. The provider must support recurring subscriptions.
2. The provider must support monthly and yearly billing.
3. The provider must support trial periods without requiring a card.
4. The provider must support proration or equivalent mid-cycle adjustment.
5. The provider must support seat-based billing or an equivalent billing model.
6. The provider must support payment failure events and retry behavior.
7. The provider must support refunds where eligible.
8. The provider must support invoice or receipt generation.
9. The provider must support webhook events for billing state changes.
10. MoneyBag must not store full card data.
11. Billing webhooks must be verified and processed idempotently.
12. If a payment provider event conflicts with local state, reconciliation must favor the provider for billing status while preserving ledger integrity.

#### 6.7.3 Email Delivery Provider

**Requirements:**

1. The provider must support transactional email delivery.
2. Required messages include:
   - email verification,
   - password reset,
   - security alerts,
   - trial reminders,
   - billing notices,
   - workspace invitations,
   - approval notifications where email is enabled.
3. Delivery status, bounces, and complaints should be tracked where supported.
4. Suppressed or bounced addresses must be handled safely.
5. Email failure must not roll back a valid financial mutation unless the workflow explicitly requires successful delivery.
6. Email templates must not expose private financial details beyond what is required for the notification.

#### 6.7.4 File Storage Provider

**Requirements:**

1. Uploaded receipts and documents must be stored privately.
2. Public access to uploaded financial documents must be blocked by default.
3. Access must require workspace authorization or a time-limited signed URL.
4. File type validation must occur before storage.
5. File size limits must be enforced.
6. Malware scanning should be used where available.
7. Attachments must be deleted according to the related record’s deletion policy unless legal retention applies.

#### 6.7.5 OCR Provider

OCR is available in Business and Enterprise workspaces.

**Requirements:**

1. OCR may process receipt images to suggest vendor, date, amount, and currency.
2. OCR output is not authoritative.
3. Users must confirm OCR-suggested values before saving them to a transaction.
4. OCR processing must comply with applicable data processing agreements.
5. OCR failure must not block manual transaction entry.
6. OCR results should include confidence information where available.

#### 6.7.6 Accounting Export Targets

Direct accounting integrations are not required for Core Release. However, exports should be compatible with common accounting workflows.

**Supported export targets:**

1. Generic CSV.
2. QuickBooks-compatible CSV format where feasible.
3. Xero-compatible CSV format where feasible.
4. PDF summary reports.

**Rules:**

1. Accounting exports must include date, description, category, amount, currency, wallet, and transaction identifier.
2. Exports must not combine currencies into one converted total.
3. Exports must identify timezone and date range.
4. Direct API synchronization with accounting software is deferred unless separately approved.

#### 6.7.7 Communication Tool Integrations

Direct Slack or Microsoft Teams integrations are not required for Core Release.

MoneyBag must support webhook-based integration so that authorized external systems can receive event notifications. Native chat-tool integrations may be added later.

---

### 6.8 Data Import and Export Standards

#### 6.8.1 CSV Transaction Import

CSV transaction import is defined functionally in Section 4. The platform requirements are:

1. Imports must be processed through a validated batch workflow.
2. Imports must not apply partial results if validation fails.
3. Import batches must be retained as operational records.
4. Import row errors must be reportable to the user.
5. Import processing must respect plan limits.
6. Import processing must prevent duplicate submission.
7. Large imports should support asynchronous processing where necessary.
8. Users must see import status: queued, validating, failed, completed.

#### 6.8.2 CSV Exports

CSV exports must be available for permitted report and list views.

**CSV Requirements:**

1. UTF-8 encoding.
2. Header row with stable column names.
3. Explicit currency column.
4. Explicit date column.
5. Timezone metadata included in report exports.
6. Amounts exported in decimal representation suitable for spreadsheet use.
7. Internal identifiers may be included where useful for reconciliation.
8. Sensitive fields must respect role permissions.

#### 6.8.3 PDF Exports

PDF exports are intended for human-readable reports.

**PDF Requirements:**

1. Report title.
2. Workspace name.
3. Date range.
4. Timezone.
5. Currency scope.
6. Generated timestamp.
7. Generated by user where audit applies.
8. Clear table formatting.
9. Multi-currency separation.

#### 6.8.4 Personal Data Export

Users may request an export of eligible personal data.

**Personal data export may include:**

1. Profile data.
2. Authentication metadata, excluding secrets.
3. Workspace membership data.
4. Transactions created by the user where permitted.
5. Budgets and goals created by the user where permitted.
6. Attachments uploaded by the user where permitted.
7. Notification preferences.
8. Billing history where user is billing manager.

**Rules:**

1. Export must be provided in a portable format.
2. Recommended formats: JSON, CSV, or ZIP archive.
3. Export must not include data the user is not authorized to access.
4. Export must not expose secrets, hashes, payment card data, or internal security details.
5. Export requests must be protected by recent verification.

#### 6.8.5 Workspace Export

Workspace Owners or Admins may export workspace data according to tier and retention state.

**Workspace export may include:**

1. Wallets.
2. Categories.
3. Tags.
4. Transactions.
5. Transfers.
6. Budgets.
7. Goals and goal activity.
8. Shared allocations.
9. Settlements.
10. Invoices.
11. Reimbursement records.
12. Departments and projects.
13. Audit logs where permitted.
14. Attachments or attachment metadata.

**Rules:**

1. Workspace export must be available during read-only retention where policy permits.
2. Export must respect role permissions.
3. Large exports may be generated asynchronously.
4. Export completion must notify the requesting user.
5. Export links must be time-limited and protected.

---

### 6.9 Internal System Events and Automation

MoneyBag relies on internal automated processes. These processes must be observable, idempotent, and safe under failure.

#### 6.9.1 Core Automated Processes

| Process                         | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| Recurring transaction generator | Creates scheduled transactions.                 |
| Trial expiration handler        | Changes workspace state when trial ends.        |
| Subscription renewal handler    | Processes renewals.                             |
| Payment failure handler         | Enters grace period and retry flow.             |
| Suspension handler              | Moves unresolved workspaces to read-only state. |
| Retention deletion scheduler    | Schedules deletion after retention period.      |
| Budget alert evaluator          | Detects threshold crossings.                    |
| Notification dispatcher         | Sends in-app and email notifications.           |
| Audit writer                    | Records sensitive actions.                      |
| Webhook dispatcher              | Sends external events.                          |

#### 6.9.2 Automation Rules

1. Automated financial generation must be idempotent.
2. A scheduled job must not create duplicate transactions for the same occurrence.
3. A failed notification must not corrupt or roll back a valid financial record unless the workflow explicitly requires delivery.
4. A failed external integration must not leave subscription state permanently unresolved.
5. Automated state changes must be logged.
6. Automated deletion must follow the warning schedule defined in Section 3.
7. Automated processes must support retry and reconciliation.
8. Automated processes must expose operational status for administrators or internal monitoring.

---

### 6.10 Integration Failure Handling

| Failure Type                     | Required Product Behavior                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| OAuth provider unavailable       | Display safe error and allow retry or alternative sign-in where available.                             |
| Payment provider webhook delayed | Do not immediately delete or corrupt workspace state. Reconcile when event arrives.                    |
| Payment charge failure           | Enter grace period and notify billing manager.                                                         |
| Email delivery failure           | Retry where appropriate. Do not roll back financial records unless delivery is mandatory for the flow. |
| File upload failure              | Preserve form data where possible and show retry.                                                      |
| OCR unavailable                  | Allow manual entry.                                                                                    |
| CSV import processing failure    | Reject batch or mark failed without partial ledger changes.                                            |
| Webhook endpoint unreachable     | Retry according to schedule and show delivery status.                                                  |
| API rate limit exceeded          | Return safe retry guidance.                                                                            |
| Export generation failure        | Show error and allow retry.                                                                            |

---

### 6.11 Data Migration and Onboarding Imports

1. The primary migration path for Core Release is CSV import.
2. MoneyBag does not provide bank synchronization in the Core Release.
3. MoneyBag does not provide automatic migration from third-party apps unless separately approved.
4. Enterprise migrations may be supported through professional services or approved administrative tools.
5. Migration tools must validate data before applying it.
6. Migration must preserve currency explicitness.
7. Migration must not silently convert amounts between currencies.
8. Migration must provide row-level error feedback where practical.
9. Migration should support dry-run or preview where feasible.

---

### 6.12 Future Architecture Considerations

The following are not required for Core Release, but the architecture should avoid blocking them:

1. Progressive Web App capabilities.
2. Native mobile applications.
3. Bank account synchronization.
4. Automatic currency conversion.
5. Public developer API.
6. Real-time collaborative editing.
7. Direct accounting software synchronization.
8. Card issuing integration.
9. Investment portfolio tracking.
10. Advanced rule-based automation.

These capabilities must not be implemented until promoted into an approved product requirements version.

---

## Section 7: Security, Privacy & Regulatory Compliance

This section defines the mandatory security, privacy, and compliance requirements for MoneyBag. These requirements apply to all workspaces, tiers, users, administrators, and integrations.

Security and privacy behavior must be enforced at trusted system boundaries. Interface-level hiding of features is not sufficient.

---

### 7.1 Security Principles

1. **Least privilege.**
   Users, members, administrators, and service accounts receive only the permissions required for their role.

2. **Defense in depth.**
   Security controls must operate across authentication, authorization, data storage, transport, logging, and operational processes.

3. **Safe defaults.**
   New workspaces and accounts start with secure defaults. More permissive behavior requires explicit authorized configuration.

4. **Trusted enforcement.**
   All access rules must be enforced server-side. Client-side rendering decisions do not define authorization.

5. **Data minimization.**
   MoneyBag collects only the data required to provide, secure, bill, and improve the product within lawful purposes.

6. **Financial integrity.**
   Security controls must not allow silent mutation of financial records. Corrections must be traceable.

7. **Fail securely.**
   Failures must not expose sensitive data, grant unauthorized access, or leave financial state inconsistent.

8. **Auditability.**
   Sensitive actions must be logged in a tamper-evident manner.

---

### 7.2 Data Classification

| Data Class             | Examples                                                                    | Handling Requirement                                        |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Public data            | Marketing pages, plan information, public maintenance page                  | No confidentiality requirement                              |
| User identity data     | Name, email address, profile image, timezone, locale                        | Protected; visible only to authorized contexts              |
| Authentication secrets | Password hashes, TOTP secrets, recovery codes, session tokens, OAuth tokens | Never exposed; encrypted or hashed as required              |
| Financial data         | Wallets, transactions, budgets, goals, settlements, invoices, reports       | Workspace-scoped; protected by role and tier                |
| Payment data           | Payment provider references, invoice history, billing email                 | No full card data stored by MoneyBag                        |
| Attachments            | Receipts, invoices, supporting documents                                    | Private; access-controlled; malware-checked where available |
| Audit data             | Admin actions, approval decisions, settings changes, security events        | Tamper-evident; restricted access                           |
| Operational logs       | Application logs, request logs, error logs                                  | Must not contain unnecessary sensitive data                 |

---

### 7.3 Authentication Security

#### 7.3.1 Password Requirements

1. Passwords must be at least 8 characters long.
2. Passwords must include at least:
   - one uppercase letter,
   - one lowercase letter,
   - one digit.
3. Passwords must be hashed using a strong adaptive hashing algorithm such as bcrypt or Argon2id.
4. Plaintext passwords must never be stored, logged, transmitted in URLs, or included in error messages.
5. Password changes require confirmation of the current password or another approved strong verification method.
6. After a password change, all active sessions except the current session must be invalidated.

#### 7.3.2 OAuth Authentication

1. Supported OAuth providers are Google and Apple.
2. OAuth flows must use secure redirect handling and state validation.
3. Provider tokens must be protected and not exposed to unauthorized contexts.
4. Email verification may be trusted only when the provider confirms ownership of the email address.
5. If an OAuth login matches an existing MoneyBag email account, account linking must require authentication through the existing account.
6. Apple “Hide My Email” must be handled using Apple’s stable user identifier.
7. Users may unlink an OAuth provider only if at least one valid authentication method remains.
8. GitHub OAuth is not supported.

#### 7.3.3 Email Verification

1. Email-based registration must verify ownership of the email address before full account activation.
2. Verification links must be single-use and time-limited.
3. Expired or invalid verification links must fail safely and provide a restart option.
4. Email change requests must verify the new email address.
5. The previous email address should be notified when an email change is requested or completed, subject to privacy and deliverability constraints.

#### 7.3.4 Password Recovery

1. Password reset requests must generate a single-use, time-limited recovery link.
2. Recommended reset link expiry is 30 minutes.
3. Reset links must be invalidated after use.
4. Expired, reused, or invalid reset links must fail safely.
5. Password reset responses must not reveal whether an email address exists.
6. Successful password reset must invalidate all active sessions.

#### 7.3.5 Two-Factor Authentication

1. Users may enable app-based TOTP two-factor authentication.
2. When 2FA is enabled, sign-in requires a valid second factor.
3. Setup must generate one-time recovery codes.
4. Recovery codes must be displayed once and stored hashed.
5. A valid unused recovery code may replace the normal second factor during sign-in.
6. Regenerating recovery codes invalidates previous codes.
7. Disabling 2FA requires password confirmation and, where possible, a valid TOTP code.
8. Enterprise workspaces may enforce 2FA for all members.
9. If 2FA is enforced, users without a configured second factor must be blocked from accessing the Enterprise workspace until setup is complete.

#### 7.3.6 Recent Verification for Sensitive Actions

Sensitive actions must require recent verification. Recent verification means the user has recently authenticated or confirmed a strong factor within a time window defined by the security policy.

Sensitive actions include:

1. Changing password.
2. Disabling 2FA.
3. Regenerating recovery codes.
4. Changing account email.
5. Deleting account.
6. Transferring workspace ownership.
7. Deleting a workspace.
8. Changing billing ownership.
9. Issuing refunds in Admin Console.
10. Manual entitlement changes in Admin Console.
11. Changing sensitive workspace security settings.

---

### 7.4 Session Security

1. Session tokens must be unpredictable and sufficiently long.
2. Session tokens must be transmitted only over HTTPS.
3. Web session cookies must use secure attributes appropriate for the environment.
4. Recommended cookie attributes:
   - `Secure`,
   - `HttpOnly`,
   - `SameSite` set to a safe value.
5. Sessions must expire after inactivity according to policy.
6. “Remember me” sessions may have a longer duration but must remain revocable.
7. Users must be able to view active sessions where practical and revoke them.
8. Administrators must be able to revoke sessions for users within authorized workspaces where supported.
9. Sessions must be invalidated upon:
   - logout,
   - password change,
   - 2FA disable,
   - account deletion,
   - confirmed account compromise,
   - privilege change where security risk is significant.

---

### 7.5 Authorization and Access Control

#### 7.5.1 Server-Side Enforcement

1. Every request must be authenticated and authorized at a trusted backend boundary.
2. Missing or invalid authentication must result in safe denial.
3. Insufficient permissions must result in safe denial.
4. Authorization checks must apply to UI actions, API calls, background jobs, exports, and file access.
5. Client-side feature hiding is not sufficient authorization.

#### 7.5.2 Workspace Isolation

1. Workspace data must be accessible only to users with valid membership.
2. Cross-workspace access is prohibited unless explicitly authorized by product rules.
3. A user’s personal workspace data must not be exposed through Team, Business, or Enterprise workspaces.
4. A Team or Business workspace’s data must not be exposed through a user’s personal workspace.
5. Search, reports, exports, notifications, API responses, and file access must respect workspace isolation.

#### 7.5.3 Role Enforcement

1. Roles must be enforced server-side.
2. Role changes must be audited.
3. The last Owner of a Shared workspace cannot be removed without ownership transfer or workspace deletion.
4. The last Admin of a Governed workspace cannot be removed without adding another Admin.
5. Users cannot approve their own submissions by default.
6. Viewer and Auditor roles must be read-only.
7. External delegated access must be time-limited and revocable.

#### 7.5.4 Administrative Access

1. Access to Admin Console requires explicit Administrator authorization.
2. Administrators are not automatically members of user workspaces.
3. Administrators must not access private financial records except through an explicitly authorized, audited operational workflow.
4. Core Release admin access should focus on operational metadata, subscription management, support actions, and platform settings.
5. Sensitive admin actions require confirmation, reason where appropriate, and audit logging.

---

### 7.6 Data Protection

#### 7.6.1 Encryption in Transit

1. All authenticated and sensitive traffic must use HTTPS.
2. TLS must be enforced for web application, API, webhook delivery, and administrative interfaces.
3. Plaintext HTTP must not be used for authenticated or sensitive content.

#### 7.6.2 Encryption at Rest

1. Persistent sensitive data must be encrypted at rest.
2. Recommended baseline: AES-256 or equivalent provider-managed encryption.
3. Backups must be encrypted.
4. Attachment storage must be private and encrypted.

#### 7.6.3 Field-Level Protection

1. Authentication secrets must be hashed or encrypted as appropriate.
2. TOTP secrets must be encrypted at rest.
3. Recovery codes must be hashed.
4. Payment card data must not be stored.
5. Tax identifiers and company billing details must be protected and visible only to authorized users.
6. Enterprise may require field-level encryption for selected sensitive fields where contractually agreed.

#### 7.6.4 Logging and Error Safety

1. Logs must not contain passwords, tokens, recovery codes, full payment card data, or unnecessary sensitive financial details.
2. Error messages shown to users must not expose stack traces, database details, internal identifiers, or private account state.
3. API errors must be structured and safe.
4. Support logs may contain operational identifiers but must follow access controls and retention rules.

---

### 7.7 Secrets and Credential Management

1. Secrets must not be hardcoded in client code, public repositories, logs, or error output.
2. Secrets must be stored using a secure secrets manager or equivalent environment-specific mechanism.
3. Secrets must be separated by environment.
4. Production secrets must not be accessible from development or test environments.
5. Secrets must support rotation.
6. Compromised secrets must be revocable and replaceable without unnecessary service disruption.
7. API keys must be revocable by workspace Admins.
8. Webhook signing secrets must be rotatable.

---

### 7.8 Payment Data Security

1. Payment card data must be handled by the approved payment provider.
2. MoneyBag must not store full card numbers, expiration dates, card security codes, or card magnetic stripe data.
3. MoneyBag may store provider-generated customer references, subscription identifiers, payment method identifiers, and invoice metadata.
4. Checkout flows must use provider-hosted or provider-approved components where card data is involved.
5. Payment webhooks must be authenticated and verified.
6. Payment events must be processed idempotently.
7. Refunds must be authorized, confirmed, and audited.
8. Billing history must be accessible to authorized billing managers.
9. Payment disputes must not expose sensitive payment data to unauthorized users.
10. MoneyBag’s PCI DSS responsibility should be minimized by avoiding direct card handling, subject to provider integration model.

---

### 7.9 Application Security Requirements

#### 7.9.1 Input Validation

1. All user input must be validated server-side.
2. File uploads must be validated for type, size, and content constraints.
3. Financial inputs must be validated for currency, amount range, date validity, and entity existence.
4. Imports must be validated before applying ledger changes.

#### 7.9.2 Output Safety

1. User-generated content must be rendered safely to prevent cross-site scripting.
2. URLs, redirects, and file access links must be validated.
3. Exported files must not include unauthorized data.

#### 7.9.3 Request Protection

1. State-changing requests must be protected against cross-site request forgery.
2. Rate limiting must be applied to authentication, password recovery, invitation, checkout, API, and export endpoints.
3. Brute-force protection must lock or delay repeated failed authentication attempts.
4. Recommended authentication rate limit: no more than 5 failed attempts per email per short time window before temporary lockout or challenge.
5. Invitation and contact endpoints must be protected against spam and abuse.

#### 7.9.4 Duplicate Submission Protection

1. Financial mutations must prevent accidental duplicate submission.
2. API mutations that create sensitive records must support idempotency keys.
3. Checkout, transfer, settlement, import, and approval actions must be protected from duplicate processing.
4. Duplicate webhook events must be handled safely.

#### 7.9.5 Dependency and Release Security

1. Third-party libraries should be maintained and monitored for known vulnerabilities.
2. Security patches should be applied according to operational priority.
3. Releases should pass automated checks where available.
4. Critical vulnerabilities affecting Core Release must be addressed promptly.

---

### 7.10 Upload and Attachment Security

1. Uploads must be authenticated and workspace-authorized.
2. Allowed file types must be restricted.
3. Core supported types should include JPEG, PNG, and PDF.
4. Maximum file size must be enforced. Recommended default: 10 MB per file.
5. Uploaded files must be scanned or checked where malware scanning is available.
6. Files must not be publicly accessible by default.
7. File access must require authorization or a time-limited signed URL.
8. File names must be sanitized.
9. Attachment deletion must follow the deletion policy of the related record.
10. Legal retention may preserve attachments separately from user-visible records.

---

### 7.11 Audit and Accountability

#### 7.11.1 Audit Scope

Audit logging is mandatory for sensitive actions, including:

1. Authentication security changes.
2. Role changes.
3. Member invitations and removals.
4. Workspace settings changes.
5. Billing changes.
6. Subscription changes initiated by administrators.
7. Refunds.
8. Manual entitlement changes.
9. Approval decisions.
10. Void or correction of approved transactions.
11. Settlement recording.
12. Reimbursement status changes.
13. API key creation and revocation.
14. Webhook endpoint changes.
15. Data exports.
16. Admin console sensitive actions.
17. Workspace suspension or deletion.

#### 7.11.2 Audit Record Requirements

Each audit record should include:

1. Actor identifier.
2. Actor role.
3. Timestamp.
4. Workspace identifier.
5. Action type.
6. Entity type and identifier.
7. Summary of change.
8. Reason where required.
9. Source context such as web, API, or admin console.

#### 7.11.3 Audit Integrity

1. Audit logs must be tamper-evident.
2. Audit logs must not be editable by regular users.
3. Audit logs must not be deleted during the active workspace lifecycle unless permitted by approved retention policy.
4. Audit access must be restricted.
5. Audit log access should itself be logged.

---

### 7.12 Privacy Principles

1. **Purpose limitation.**
   Personal data is used only for the purposes disclosed to the user.

2. **Data minimization.**
   MoneyBag should not require unnecessary personal data for basic financial tracking.

3. **Transparency.**
   Users must be informed about what data is collected and why.

4. **User control.**
   Users may access, export, correct, and request deletion of eligible personal data.

5. **Shared data protection.**
   Shared workspaces must not expose a member’s personal workspace data.

6. **No sale of personal data.**
   MoneyBag must not sell personal financial data.

7. **Lawful processing.**
   Billing, security, fraud prevention, and legal obligations may require processing even when optional marketing preferences are disabled.

8. **Children.**
   MoneyBag is not intended for children below the applicable minimum age. Account creation requires compliance with applicable age and capacity rules.

---

### 7.13 User Privacy Controls

#### 7.13.1 Access and Correction

1. Users may view their own profile and security settings.
2. Users may correct inaccurate profile data.
3. Users may manage notification preferences for optional categories.
4. Required security, billing, and legal messages cannot be disabled.

#### 7.13.2 Data Export

1. Users may request an export of eligible personal data.
2. Export must be provided in a portable format.
3. Export must respect workspace permissions.
4. Export must not include secrets, hashes, payment card data, or unauthorized workspace data.
5. Export requests should require recent verification.

#### 7.13.3 Account Deletion

1. Users may request permanent account deletion.
2. Deletion requires clear warning and recent verification.
3. Before deleting an account, the user must resolve ownership constraints:
   - A Shared workspace Owner must transfer ownership or delete the workspace.
   - A Governed workspace Admin must ensure another Admin exists or initiate workspace deletion according to policy.
4. Account deletion does not immediately erase shared financial history where other members remain.
5. Historical attribution may be replaced with a non-identifying “Former Member” record where required for financial integrity.
6. Billing and tax records may be retained as required by law.
7. Security and audit logs may be retained separately for legal or fraud-prevention purposes.

---

### 7.14 Data Retention and Deletion

#### 7.14.1 Active Data

1. Active workspace data remains available while the workspace is active.
2. Free workspace data remains available subject to Free tier limits.
3. Paid workspace data remains available while subscription is active or within permitted grace/cancellation period.

#### 7.14.2 Suspended and Read-Only Workspaces

1. Suspended Team, Business, or Enterprise workspaces enter read-only retention.
2. Default retention period is 90 days from suspension.
3. During retention, authorized users may export data.
4. During retention, reactivation restores access if subscription requirements are met.
5. Warnings must be sent before scheduled deletion.

#### 7.14.3 Deletion

1. After the retention period, workspace data is scheduled for permanent deletion.
2. Deletion must include financial records, workspace settings, member relationships, and attachments unless legal retention applies.
3. Personal workspaces outside the deleted workspace are unaffected.
4. Global user account deletion follows account deletion rules.
5. Backups may retain deleted data for a limited operational recovery window. Backup retention should be defined in the Operations Specification.

#### 7.14.4 Legal Retention Exceptions

The following may be retained after workspace or account deletion where legally required:

1. Invoices and billing records.
2. Tax-related records.
3. Audit logs.
4. Fraud investigation records.
5. Dispute records.
6. Security incident records.

---

### 7.15 Regulatory Compliance

#### 7.15.1 General Privacy Compliance

MoneyBag must support compliance with applicable privacy laws where it operates, including principles commonly associated with GDPR and CCPA-style regimes.

Required capabilities include:

1. Privacy policy.
2. Terms of service.
3. Data subject access support.
4. Data correction support.
5. Data export.
6. Deletion requests.
7. Lawful basis disclosure where required.
8. Processor and subprocessor management.
9. Data breach notification process.
10. Consent management for non-essential cookies or analytics where required.

#### 7.15.2 Cross-Border Data

1. Core Release does not guarantee data residency unless explicitly provided under Enterprise contract.
2. Cross-border data transfers must comply with applicable legal mechanisms.
3. Subprocessors must be bound by appropriate data protection obligations.
4. Enterprise customers may require regional data residency where available.

#### 7.15.3 Data Residency

1. Data residency selection is an Enterprise capability.
2. If offered, residency controls must apply to primary storage of workspace data.
3. Residency does not eliminate all cross-border processing unless explicitly contracted.
4. Backup and support access implications must be disclosed to Enterprise customers.

#### 7.15.4 Financial and Tax Compliance

1. MoneyBag is not a bank unless separately authorized.
2. MoneyBag does not provide tax filing, legal, or investment advice.
3. Tax summary reports are informational only.
4. Billing invoices must support applicable tax disclosure.
5. Tax identifiers provided by customers must be protected.

#### 7.15.5 Security Compliance Programs

1. SOC 2, ISO 27001, or similar certifications may be pursued as part of future enterprise readiness.
2. Such certifications are not committed unless approved in a separate plan.
3. Enterprise customers may request security documentation where available.
4. Security questionnaires should be handled through an authorized process.

---

### 7.16 Incident Response and Breach Notification

#### 7.16.1 Incident Handling

1. Security incidents must be classified by severity.
2. Confirmed incidents must be contained, investigated, and remediated.
3. Financial integrity incidents must be prioritized.
4. Unauthorized access incidents must trigger access review and credential revocation where appropriate.
5. Incident response actions should be documented.

#### 7.16.2 Breach Notification

1. If a personal data breach requires notification under applicable law, MoneyBag must notify affected users and authorities within legally required timeframes.
2. Notifications must describe the nature of the incident where appropriate.
3. Notifications must provide recommended user actions.
4. Notifications must not expose unnecessary technical detail that could increase risk.

#### 7.16.3 Vulnerability Reporting

1. MoneyBag must provide a security contact method for vulnerability reports.
2. Reports should be acknowledged and reviewed according to severity.
3. Critical vulnerabilities affecting user data or billing must be prioritized.
4. Public disclosure of vulnerabilities should be coordinated responsibly.

---

### 7.17 Abuse, Fraud, and Enforcement

1. MoneyBag may restrict accounts or workspaces involved in fraud, abuse, illegal activity, or security violations.
2. Restrictions should be reviewed by authorized personnel.
3. Trial abuse, payment fraud, spam invitations, and automated scraping may trigger protective action.
4. Enforcement actions should be logged.
5. Users affected by enforcement should receive a safe explanation where legally and operationally appropriate.
6. Appeal processes may be provided through support.

---

### 7.18 Tier-Specific Security Entitlements

| Security Capability                |  Free |  Solo |                   Team |       Business |              Enterprise |
| ---------------------------------- | ----: | ----: | ---------------------: | -------------: | ----------------------: |
| Password authentication            |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Google OAuth                       |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Apple OAuth                        |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Email verification                 |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Password recovery                  |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Optional TOTP 2FA                  |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Enforced 2FA for workspace members |    No |    No |                     No |       Optional |                     Yes |
| Role-based access control          | Basic | Basic |             Team roles | Governed roles | Governed + custom roles |
| Workspace isolation                |   Yes |   Yes |                    Yes |            Yes |                     Yes |
| Audit trail                        |    No |    No | Basic activity history |            Yes |                Advanced |
| API access                         |    No |    No |                     No |            Yes |                     Yes |
| Webhooks                           |    No |    No |                     No |            Yes |                     Yes |
| SSO / SAML / OIDC                  |    No |    No |                     No |             No |                     Yes |
| SCIM provisioning                  |    No |    No |                     No |             No |                     Yes |
| IP allowlisting                    |    No |    No |                     No |             No |         Where supported |
| Data residency selection           |    No |    No |                     No |             No |         Where supported |
| Custom data retention              |    No |    No |                     No |             No |         Where supported |
| Security documentation access      |    No |    No |                     No |        Limited |             Contractual |

---

## Section 8: Internal Operations & Platform Administration

This section defines MoneyBag’s internal operational requirements: administration, support tooling, monitoring, maintenance, backup, disaster recovery, incident management, and operational governance.

Internal tools must allow MoneyBag operators to run the platform safely without exposing unnecessary user data. Operational access must follow least privilege, strong authentication, confirmation, reason capture, and auditability.

---

### 8.1 Operational Objectives

1. MoneyBag must be operable by authorized personnel without direct access to production data unless explicitly required and audited.
2. Administrators must be able to manage users, workspaces, subscriptions, billing issues, plan settings, coupons, audit logs, and essential platform settings.
3. Support teams must be able to diagnose problems safely without reading private financial records by default.
4. Financial and billing operations must be traceable.
5. System health must be observable.
6. Failures must be detectable, diagnosable, and recoverable.
7. Maintenance states must be communicated clearly to users.
8. Operational actions must not bypass security, privacy, or financial integrity rules.

---

### 8.2 Internal Roles and Access Model

MoneyBag’s internal administration must use role-based access. Internal roles are separate from workspace roles.

#### 8.2.1 Recommended Internal Roles

| Internal Role            | Purpose                             | Typical Permissions                                                                       |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| Super Administrator      | Full platform administration        | Manage admins, global settings, billing operations, workspace interventions, audit access |
| Billing Administrator    | Subscription and payment operations | View billing status, refunds, manual entitlements, invoices, coupons                      |
| Support Agent            | Customer support diagnostics        | Limited read-only user/workspace diagnostics, support notes, safe account actions         |
| Security Administrator   | Security and abuse review           | Session revocation, security logs, abuse cases, access reviews                            |
| Operations Administrator | Platform health and maintenance     | Monitoring access, maintenance mode, feature flags, operational settings                  |
| Read-Only Auditor        | Internal compliance review          | Read-only access to audit logs and operational records                                    |

#### 8.2.2 Internal Access Rules

1. Internal access must require an authenticated internal account.
2. Multi-factor authentication must be mandatory for all internal administrative roles.
3. Shared internal accounts are not permitted.
4. Internal roles must be assigned by a Super Administrator or equivalent authorized role.
5. Internal role changes must be audited.
6. Access must be reviewed periodically.
7. Internal access must be revoked when no longer required.
8. Internal administrators are not automatically members of user workspaces.
9. Internal administrators must not access private financial transaction details unless elevated access is explicitly authorized, time-limited, reasoned, and audited.

#### 8.2.3 Elevated Access

Elevated access means temporary permission to view or act on data beyond normal support scope.

1. Elevated access must require a justified reason.
2. Elevated access should be time-limited.
3. Elevated access must be audited.
4. Elevated access should notify a security or compliance owner where practical.
5. Elevated access must not be used for routine browsing.
6. Elevated access must expire automatically unless renewed through an authorized process.

---

### 8.3 Admin Console Core Modules

The Admin Console is restricted to authorized internal users. Client-side visibility alone is not sufficient authorization.

#### 8.3.1 Operational Dashboard

The operational dashboard should provide a high-level view of platform health and business state.

Recommended metrics:

| Metric Category | Examples                                                         |
| --------------- | ---------------------------------------------------------------- |
| Users           | Total registered users, active users, new registrations          |
| Workspaces      | Active workspaces by type and tier                               |
| Trials          | Active trials, trials ending soon, trial conversion              |
| Subscriptions   | Active paid subscriptions, cancellations, failed payments        |
| Revenue         | MRR, annualized recurring revenue, refunds                       |
| Seats           | Active Business/Enterprise seats, seat additions/removals        |
| Retention       | Suspended workspaces, workspaces approaching deletion            |
| Security        | Failed logins, MFA challenges, suspicious activity alerts        |
| Operations      | Background job failures, webhook failures, notification failures |

#### 8.3.2 User Management

Authorized administrators may search and manage user accounts.

**Search fields:**

1. User ID.
2. Email address.
3. Display name.
4. Registration date.
5. Account status.
6. Authentication method.
7. Workspace membership.

**User detail view:**

| Data                             | Visibility                                       |
| -------------------------------- | ------------------------------------------------ |
| User ID                          | Authorized admin                                 |
| Email address                    | Authorized admin                                 |
| Display name                     | Authorized admin                                 |
| Email verification status        | Authorized admin                                 |
| Authentication methods           | Authorized admin                                 |
| 2FA status                       | Authorized admin                                 |
| Account status                   | Authorized admin                                 |
| Created date                     | Authorized admin                                 |
| Last sign-in metadata            | Authorized admin where needed                    |
| Workspace memberships            | Authorized admin                                 |
| Support notes                    | Authorized support/admin                         |
| Transaction-level financial data | Not visible by default; elevated access required |

**User actions:**

| Action                         | Requirements                |
| ------------------------------ | --------------------------- |
| Activate/deactivate account    | Confirmation, reason, audit |
| Force logout all sessions      | Confirmation, audit         |
| Require password reset         | Confirmation, audit         |
| Reset email verification       | Confirmation, audit         |
| Block sign-in due to abuse     | Reason, audit, reviewable   |
| Add/remove internal admin role | Super Admin action, audit   |

**Rules:**

1. Deactivating a user must not silently delete workspaces where other members exist.
2. Deactivation must respect workspace ownership constraints.
3. Support agents must not deactivate accounts without appropriate role permission.
4. Account recovery assistance must not bypass verification requirements.

#### 8.3.3 Workspace Management

Authorized administrators may search and manage workspaces.

**Search fields:**

1. Workspace ID.
2. Workspace name.
3. Workspace type.
4. Subscription tier.
5. Subscription state.
6. Owner email.
7. Member count.
8. Creation date.
9. Retention deadline.

**Workspace detail view:**

| Data                          | Visibility                                       |
| ----------------------------- | ------------------------------------------------ |
| Workspace ID/name             | Authorized admin                                 |
| Workspace type                | Authorized admin                                 |
| Context                       | Authorized admin                                 |
| Tier and billing cadence      | Authorized admin                                 |
| Subscription state            | Authorized admin                                 |
| Trial state                   | Authorized admin                                 |
| Owner and billing manager     | Authorized admin                                 |
| Member count                  | Authorized admin                                 |
| Seat count                    | Authorized admin                                 |
| Created date                  | Authorized admin                                 |
| Retention deadline            | Authorized admin                                 |
| Financial transaction details | Not visible by default; elevated access required |

**Workspace actions:**

| Action                             | Requirements                                    |
| ---------------------------------- | ----------------------------------------------- |
| Suspend workspace                  | Confirmation, reason, audit                     |
| Reactivate workspace               | Confirmation, reason, audit                     |
| Extend retention period            | Reason, audit, time-limited                     |
| Schedule deletion                  | Confirmation, reason, audit                     |
| Cancel scheduled deletion          | Confirmation, reason, audit                     |
| Adjust subscription state manually | Billing Admin or higher, reason, audit          |
| Transfer ownership                 | Only through verified owner consent flow, audit |

**Rules:**

1. Administrative suspension must not delete data immediately.
2. Administrative deletion must follow the retention and warning policy unless legal exception applies.
3. Workspace ownership transfer must not be performed without verified consent from the current owner or a documented legal/support process.
4. Admin actions must not automatically make the administrator a member of the workspace.

#### 8.3.4 Subscription and Billing Operations

Billing administrators may manage subscription lifecycle issues.

**Subscription detail view:**

1. Workspace.
2. Plan tier.
3. Billing cadence.
4. Subscription state.
5. Trial status.
6. Current period end.
7. Renewal date.
8. Seat count.
9. Payment method status.
10. Payment attempts.
11. Grace period status.
12. Invoice history.
13. Refund history.
14. Applied coupons.

**Billing actions:**

| Action                           | Requirements                                   |
| -------------------------------- | ---------------------------------------------- |
| Cancel subscription              | Confirmation, reason, audit                    |
| Reactivate canceled subscription | Confirmation, reason, audit                    |
| Extend trial                     | Reason, duration limit, audit                  |
| Manual entitlement override      | Time-bound, reason, audit                      |
| Issue refund                     | Confirmation, reason, audit, eligibility check |
| Retry failed payment             | User-initiated or authorized admin action      |
| Correct seat count               | Reason, audit, proration visibility            |
| Resend invoice/receipt           | Audit where practical                          |
| Apply/remove coupon              | Eligibility validation, audit                  |

**Billing rules:**

1. Manual entitlement overrides must not create undisclosed payment charges.
2. Manual entitlements should be time-bound by default.
3. Manual entitlements must not silently replace an active paid subscription unless explicitly confirmed.
4. Refunds must display access consequences before confirmation.
5. Large refunds may require dual approval based on internal policy.
6. Billing corrections must be traceable through audit history.
7. Payment card data must not be visible in the Admin Console.

#### 8.3.5 Plan, Pricing, and Coupon Management

MoneyBag has five public tiers: Free, Solo, Team, Business, and Enterprise.

**Plan management rules:**

1. Administrators may manage plan availability, pricing display, trial configuration, and feature flags.
2. Administrators must not create a sixth public consumer plan without approved product requirements.
3. Enterprise contract terms may be configured separately.
4. Price changes must follow advance notice rules for existing subscriptions.
5. Historical charges must not be rewritten by future price changes.

**Coupon management:**

| Coupon Attribute | Requirement                    |
| ---------------- | ------------------------------ |
| Code             | Unique                         |
| Discount type    | Percentage or fixed amount     |
| Eligible plans   | Configurable                   |
| Eligible cadence | Monthly, yearly, or both       |
| Expiry date      | Required or explicit no expiry |
| Redemption limit | Required or explicit unlimited |
| Per-user limit   | Required                       |
| Active status    | Enable/disable                 |
| Usage statistics | Visible                        |

**Coupon rules:**

1. A coupon must not produce a negative charge.
2. A fixed discount greater than the charge amount reduces the charge to zero.
3. Coupons cannot be combined unless explicitly configured.
4. Deactivated coupons cannot be applied to new purchases.
5. Coupon redemptions must be logged.

#### 8.3.6 Audit and Activity Review

The Admin Console must provide access to audit information.

1. Audit logs must be searchable by actor, action, entity, workspace, date range, and severity.
2. Sensitive audit records must be read-only.
3. Audit log access must be restricted by internal role.
4. Audit log access should itself be logged.
5. Audit exports must be authorized and logged.

#### 8.3.7 General Settings

The Admin Console must provide minimum settings required to operate the Core Release.

| Setting                      | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| Application name             | Product branding                             |
| Support email                | User-facing support contact                  |
| Security contact             | Vulnerability/security reports               |
| Legal URLs                   | Terms of Service and Privacy Policy          |
| Maintenance mode             | Enable/disable public maintenance experience |
| Registration enabled         | Allow or block new account creation          |
| Trial enabled                | Allow or disable trial activation            |
| Paid purchase enabled        | Allow or block new paid subscriptions        |
| Notification sender identity | Transactional email sender details           |
| Default timezone behavior    | Fallback timezone rules                      |
| Session/security thresholds  | Operational security tuning                  |
| Feature flags                | Controlled rollout of optional capabilities  |

**Rules:**

1. Changes to General Settings must require confirmation.
2. Changes to General Settings must be audited.
3. Maintenance mode must not expose internal details.
4. Disabling registration or purchases must not affect already active entitlements unless explicitly required.

#### 8.3.8 Admin Profile and Security

Internal administrators may manage their own profile and security settings.

1. Admin profile includes name, email, role visibility, and security status.
2. Admins may change their password after strong verification.
3. Admins may view their active sessions and revoke them.
4. Admins may manage their own MFA settings subject to enforcement rules.
5. Admin security changes must be audited.

---

### 8.4 Customer Support Tooling

Support tooling must allow efficient diagnosis while protecting user privacy.

#### 8.4.1 Support Principles

1. Support must verify the requester’s identity before making account-level changes.
2. Support must not disclose private data to unverified parties.
3. Support must not bypass authentication or verification controls.
4. Support should prefer user-visible recovery flows over internal overrides.
5. Support actions must be logged.
6. Support should see the minimum data necessary to resolve the issue.

#### 8.4.2 Support Diagnostics

Support diagnostics may include:

1. Account status.
2. Email verification status.
3. OAuth linkage status.
4. MFA status.
5. Workspace memberships.
6. Subscription state.
7. Trial state.
8. Failed payment state.
9. Workspace suspension state.
10. Retention deadline.
11. Recent non-sensitive error codes or request identifiers.

Support diagnostics should not include transaction-level financial detail unless elevated access is authorized.

#### 8.4.3 Assisted Access / Impersonation

If MoneyBag implements assisted access or impersonation, it must be tightly controlled.

1. Assisted access must require explicit user consent where feasible.
2. Assisted access must be time-limited.
3. Assisted access must be visible to the user where practical.
4. Assisted sessions must be clearly labeled internally.
5. Assisted access should default to read-only unless elevated action is authorized.
6. Billing changes during assisted access require explicit confirmation.
7. Destructive actions during assisted access require elevated approval.
8. All assisted actions must be audited.
9. Assisted access must expire automatically.

If assisted access is not implemented, support must rely on user-provided information and safe diagnostic tools.

#### 8.4.4 Common Support Workflows

| Scenario                  | Support Behavior                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------- |
| User cannot sign in       | Verify identity, guide through password reset or OAuth recovery, check account status |
| User lost 2FA access      | Verify identity through approved process, issue recovery path if valid                |
| Payment failed            | Explain failed state, guide retry, check grace period                                 |
| Workspace suspended       | Explain suspension reason, retention deadline, reactivation path                      |
| Trial ending              | Explain trial state and conversion options                                            |
| Data deletion request     | Verify identity, check ownership constraints, initiate deletion flow                  |
| Billing dispute           | Review payment state, escalate to billing administrator if refund needed              |
| Security concern          | Escalate to Security Administrator, revoke sessions if necessary                      |
| Workspace ownership issue | Require verified owner consent or legal process before intervention                   |

---

### 8.5 Observability and Monitoring

MoneyBag must be observable enough to detect and respond to operational issues.

#### 8.5.1 Monitoring Areas

| Area            | Examples                                                          |
| --------------- | ----------------------------------------------------------------- |
| Availability    | Web app, API, Admin Console, authentication endpoints             |
| Performance     | Page load latency, API latency, report generation time            |
| Errors          | HTTP 5xx rate, unhandled exceptions, failed mutations             |
| Background jobs | Recurring generator, notification dispatcher, retention scheduler |
| Billing         | Payment webhook lag, failed payments, invoice generation failures |
| Notifications   | Email delivery failures, bounces, in-app dispatch failures        |
| Integrations    | OAuth provider errors, storage failures, OCR failures             |
| Security        | Failed logins, suspicious rate patterns, admin sensitive actions  |
| Data            | Database replication lag where applicable, backup success         |

#### 8.5.2 Alerts

Alerts must be actionable and severity-based.

Recommended alert categories:

1. Critical availability failure.
2. Elevated error rate.
3. Payment webhook processing delay.
4. Background job failure.
5. Notification delivery failure above threshold.
6. Failed login spike.
7. Unauthorized admin access attempt.
8. Storage quota risk.
9. Backup failure.
10. Retention scheduler failure.

#### 8.5.3 Operational Targets

Operational targets must be finalized before production launch. Recommended baseline targets:

| Metric                         | Recommended Target                                              |
| ------------------------------ | --------------------------------------------------------------- |
| Web/API availability           | 99.9% monthly, excluding scheduled maintenance                  |
| Critical API p95 latency       | Under 2 seconds under normal load                               |
| Dashboard initial content      | Usable within a reasonable time under normal network conditions |
| Background job success rate    | > 99.5%                                                         |
| Payment webhook processing lag | < 5 minutes under normal conditions                             |
| Email delivery success         | Monitored with bounce/complaint thresholds                      |
| Backup success                 | 100% of scheduled backups                                       |
| Restore test                   | At least quarterly                                              |

These targets are product-operational expectations. Exact SLIs/SLOs should be defined in the Operations Specification.

#### 8.5.4 Dashboards

Internal dashboards should separate:

1. Business operations metrics.
2. System health metrics.
3. Security and audit metrics.
4. Billing and payment metrics.
5. Support workload metrics.

Dashboards must not expose unnecessary personal data to users without role-based need.

---

### 8.6 Maintenance Mode and Change Management

#### 8.6.1 Maintenance Mode

1. MoneyBag must support a maintenance mode toggle.
2. Maintenance mode must present a public maintenance experience.
3. The maintenance experience must explain temporary unavailability without exposing internal details.
4. The maintenance experience must provide a safe retry path.
5. Authenticated users should receive clear guidance where practical.
6. Maintenance mode must not expose Admin Console functionality to unauthorized users.

#### 8.6.2 Change Management

1. Production changes should follow a controlled release process.
2. High-risk changes should use feature flags or staged rollout.
3. Database migrations must be backward compatible where practical.
4. Releases must support rollback where feasible.
5. Changes affecting billing, authentication, authorization, or financial integrity require additional review.
6. Emergency changes must be documented after execution.

---

### 8.7 Backup, Recovery, and Disaster Recovery

#### 8.7.1 Backup Requirements

1. Production data must be backed up regularly.
2. Backups must include data required to restore financial records, workspace data, billing metadata, and audit logs.
3. Backups must be encrypted.
4. Backup access must be restricted.
5. Backup success must be monitored.
6. Backup failures must generate alerts.

#### 8.7.2 Restore Requirements

1. Restore procedures must be documented.
2. Restore tests must be performed periodically.
3. Recommended minimum restore test frequency: quarterly.
4. Restore tests should verify data integrity and service recoverability.
5. Restore results must be documented.

#### 8.7.3 Disaster Recovery Targets

Disaster recovery objectives must be approved before production launch.

Recommended baseline:

| Objective                      | Recommended Baseline                                       |
| ------------------------------ | ---------------------------------------------------------- |
| Recovery Point Objective (RPO) | ≤ 1 hour for ledger and billing data                       |
| Recovery Time Objective (RTO)  | ≤ 8 hours for critical services                            |
| Backup retention               | Defined by Operations Specification and legal requirements |
| Enterprise stricter targets    | Subject to contract                                        |

Financial data loss tolerance should be minimal. If operational constraints prevent the recommended targets, the exception must be documented and approved.

---

### 8.8 Incident Management

#### 8.8.1 Incident Severity Levels

| Severity | Definition                                                    | Examples                                                                                              |
| -------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| SEV1     | Critical outage or confirmed security/billing data compromise | Platform unavailable, payment webhook failure causing billing inconsistency, unauthorized data access |
| SEV2     | Major degradation affecting core workflows                    | Checkout failures, authentication failures, report generation outage                                  |
| SEV3     | Limited degradation with workaround                           | CSV import delayed, non-critical notification failure                                                 |
| SEV4     | Minor issue with low user impact                              | Cosmetic defect, non-critical admin reporting issue                                                   |

#### 8.8.2 Incident Response Requirements

1. Incidents must be logged.
2. Incidents must be assigned a severity.
3. SEV1 and SEV2 incidents require active response.
4. Financial integrity incidents must be prioritized.
5. Security incidents must follow the security incident process in Section 7.
6. Incidents affecting billing must be reconciled after resolution.
7. Post-incident review should be performed for SEV1 and major SEV2 incidents.
8. Corrective actions should be tracked to completion.

#### 8.8.3 User Communication During Incidents

1. Critical outages should be communicated through available channels.
2. Maintenance pages must not expose internal details.
3. If billing is affected, affected users should receive clear guidance after resolution.
4. If financial data integrity is affected, affected users must be informed where necessary.

---

### 8.9 Operational Security Controls

1. Production access must be restricted to authorized personnel.
2. Direct production database access should be avoided except through controlled tooling or break-glass procedures.
3. Break-glass access must be audited and reviewed.
4. Lower environments must not use sensitive production data unless sanitized.
5. Administrative endpoints must be protected by strong authentication and authorization.
6. Internal tools must enforce session timeouts.
7. Internal tools must log sensitive actions.
8. Operational secrets must not be shared through insecure channels.
9. Access reviews should be performed periodically.
10. Departing employees or contractors must have access revoked promptly.

---

### 8.10 Vendor and Subprocessor Operations

1. Third-party providers must be evaluated before use.
2. Critical providers include:
   - OAuth identity providers,
   - payment provider,
   - email delivery provider,
   - file storage provider,
   - OCR provider,
   - monitoring provider,
   - infrastructure provider.
3. Provider outages must be considered in failure handling.
4. Provider changes affecting privacy or security require review.
5. Subprocessors must be bound by appropriate contractual obligations.
6. Provider status and incident information should be monitored where available.

---

### 8.11 Operational Readiness Criteria

Before production launch, the following operational readiness items must be satisfied:

1. Admin Console access controls are implemented and tested.
2. Internal roles are defined and assigned.
3. Audit logging is active and reviewed.
4. Billing reconciliation process is tested.
5. Payment failure and grace-period flows are tested.
6. Trial expiration flows are tested.
7. Workspace suspension and retention flows are tested.
8. Backup and restore tests are completed.
9. Monitoring dashboards and alerts are configured.
10. Incident response process is documented.
11. Maintenance mode is tested.
12. Email delivery and bounce handling are tested.
13. Security monitoring and alerting are operational.
14. Support tooling is available for Core Release workflows.
15. Disaster recovery targets are approved.
16. On-call or escalation ownership is defined.

---

## Section 9: Delivery Strategy & Phased Rollout

This section defines the execution strategy, development phasing, technical dependencies, and release management rules for MoneyBag. The product will be delivered in sequential phases to manage architectural complexity, ensure financial integrity, and validate market assumptions before committing to heavy enterprise governance features.

Each phase must deliver a fully functional, secure, and monetizable product state. No phase may be released with broken ledger logic, compromised data isolation, or incomplete billing flows.

---

### 9.1 Delivery Philosophy

1. **Sequential Value Delivery.**
   Each phase introduces a distinct layer of capability: Single-User Foundation, Multi-User Collaboration, and Organizational Governance.

2. **Architectural Foresight.**
   Phase 1 must be built on a database schema and authentication model that natively supports Phase 2 (multi-tenancy) and Phase 3 (complex RBAC and API), preventing foundational rewrites.

3. **Financial Integrity First.**
   Ledger mutations, balance recalculations, and billing state transitions must be thoroughly tested and mathematically verified before any phase goes live.

4. **Feature Flagging.**
   Complex or high-risk features (e.g., OCR, API access, new approval rules) must be deployed behind feature flags to allow safe, gradual rollout and instant rollback if defects are discovered.

---

### 9.2 Phase 1: Foundation & Single-User (Free & Solo Tiers)

**Objective:** Launch the core ledger, single-user workspaces, basic planning tools, and the initial monetization engine.

#### 9.2.1 In-Scope Capabilities

| Domain                    | Capabilities                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Identity & Access**     | Email/password registration, Google OAuth, Apple OAuth, TOTP 2FA, password recovery, session management.                            |
| **Core Ledger**           | Wallets, transactions (income/expense/refund), transfers, categories, tags, recurring transactions, CSV import.                     |
| **Planning**              | Budgets (static and rollover), savings goals, basic cashflow tracking.                                                              |
| **Workspaces**            | Single-User workspace provisioning (Free and Solo tiers).                                                                           |
| **Solo Business Context** | Context toggle, client/project tags, P&L statement, tax summary, receipt attachments, basic invoicing, accountant share link.       |
| **Reporting**             | Monthly/yearly reports, category breakdown, trend charts, PDF/CSV export.                                                           |
| **Billing**               | Stripe/payment provider integration for Solo subscriptions, 14-day trials, upgrades, downgrades, grace periods, invoice generation. |
| **Admin Console**         | Basic user lookup, subscription state management, manual entitlement overrides, system audit logs.                                  |
| **Notifications**         | Transactional emails (verification, password reset), trial reminders, billing alerts, in-app notification center.                   |

#### 9.2.2 Out-of-Scope for Phase 1

- Shared workspaces, multi-user collaboration, expense splitting.
- Approval workflows, departments, audit trails.
- REST API, webhooks, OCR.
- Enterprise features (SSO, SCIM, multi-entity).

#### 9.2.3 Phase 1 Success Criteria

- Users can successfully register, verify email, and create a Free workspace.
- Ledger balances recalculate accurately across all transaction mutations.
- Users can successfully start a Solo trial and convert to a paid Solo subscription.
- No cross-workspace data leakage occurs.

---

### 9.3 Phase 2: Collaboration & Shared Operations (Team Tier)

**Objective:** Introduce multi-user collaboration for households and small teams, enabling shared financial tracking and settlement.

#### 9.3.1 In-Scope Capabilities

| Domain                     | Capabilities                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Workspaces**             | Shared workspace provisioning (Team tier).                                                              |
| **Membership**             | Member invitation (up to 5), RBAC (Owner, Editor, Viewer), member removal, capacity enforcement.        |
| **Shared Ledger**          | Shared wallets, shared transactions, shared budgets, shared goals.                                      |
| **Splitting Engine**       | Expense splitting (Equal, Percentage, Exact, Shares), deterministic rounding, allocation preview.       |
| **Balances & Settlements** | Net member balance calculation, settlement recording, settlement history.                               |
| **Context Switching**      | Team context toggle (Household vs. Small Team), dynamic UI and terminology adjustments.                 |
| **Basic Workflow**         | Optional single-level approval for shared expenses (Small Team context).                                |
| **Billing**                | Team flat-fee subscription, 14-day team trials, Team-to-Business upgrade conversion path.               |
| **Reporting**              | Shared income/expense totals, member contribution reports, split summaries, settlement history reports. |

#### 9.3.2 Out-of-Scope for Phase 2

- Multi-level approvals, conditional approval rules.
- Reimbursement hub, departmental isolation.
- API, webhooks, OCR.
- Enterprise features.

#### 9.3.3 Phase 2 Success Criteria

- Owners can successfully invite members and enforce the 5-member capacity limit.
- Expense splits mathematically equal the transaction amount in the smallest currency unit.
- Member balances calculate accurately across multiple shared expenses and settlements.
- A user’s personal Single-User workspace data remains completely isolated from their Team workspace data.

---

### 9.4 Phase 3: Governance, Scale & Automation (Business & Enterprise Tiers)

**Objective:** Deliver enterprise-grade governance, automation, external integrations, and advanced compliance features for growing organizations.

#### 9.4.1 In-Scope Capabilities

| Domain                       | Capabilities                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Workspaces**               | Governed workspace provisioning (Business and Enterprise tiers). Team-to-Business conversion.                        |
| **Advanced RBAC**            | Admin, Manager, Submitter, Auditor roles. Custom role creation (Enterprise). Department-scoped permissions.          |
| **Workflow Engine**          | Multi-level approval routing, conditional rules (amount/category thresholds), approval deadlines, rejection reasons. |
| **Reimbursement Hub**        | Reimbursement pipeline (Draft → Submitted → Approved → Paid), bulk payment marking.                                  |
| **Organizational Structure** | Departments, projects, departmental budgets, project budgets.                                                        |
| **Audit & Compliance**       | Tamper-evident audit trail, advanced audit filtering and export, custom data retention policies (Enterprise).        |
| **Automation & AI**          | Receipt OCR extraction, advanced duplicate detection, anomaly alerts.                                                |
| **Integrations**             | REST API, webhooks (with signature verification and retry logic), accounting software CSV exports.                   |
| **Enterprise Features**      | SSO (SAML/OIDC), SCIM provisioning, multi-entity management, consolidated reporting, data residency selection.       |
| **Billing**                  | Per-seat billing, seat proration, minimum seat enforcement, Enterprise custom contract billing.                      |

#### 9.4.2 Phase 3 Success Criteria

- Submitters can route expenses through multi-level approval chains without ledger corruption.
- Audit logs capture all required governance events and cannot be altered by regular admins.
- API and webhook integrations function reliably with proper rate limiting and idempotency.
- Enterprise SSO/SCIM integrations successfully provision and de-provision users without manual intervention.

---

### 9.5 Technical Dependencies & Prerequisites

Certain architectural decisions must be made in Phase 1 to prevent blocking Phase 2 and Phase 3.

| Dependency           | Phase 1 Requirement                                                                            | Future Phase Impact                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Database Schema**  | Must use strict `workspace_id` (tenant) scoping on all financial tables from day one.          | Prevents cross-tenant data leakage in Phase 2/3.                         |
| **Billing Provider** | Must support both flat-rate subscriptions and per-seat metered billing/proration.              | Required for Business tier seat management in Phase 3.                   |
| **Authentication**   | Must separate global `User` identity from `Workspace Membership`.                              | Required for users belonging to multiple Business workspaces in Phase 3. |
| **State Machines**   | Subscription and transaction states must be implemented as explicit, auditable state machines. | Required for complex approval and reimbursement workflows in Phase 3.    |
| **File Storage**     | Must use private, access-controlled object storage with signed URLs.                           | Required for secure receipt attachments and OCR processing in Phase 3.   |

---

### 9.6 Release Management & Rollout Strategy

#### 9.6.1 Environments

1. **Development:** For active engineering and unit testing.
2. **Staging:** Production-equivalent environment for integration testing, QA, and User Acceptance Testing (UAT). Must use sanitized/anonymized data.
3. **Production:** Live environment serving real users and processing real financial data and payments.

#### 9.6.2 Release Rules

1. **Zero-Downtime Deployments:** Database migrations and application deployments must not cause downtime for active users.
2. **Backward Compatibility:** API changes and database schema changes must be backward compatible during the rollout window.
3. **Rollback Strategy:** Every release must have a documented and tested rollback plan. Financial ledger mutations must be reversible or correctable via audit trails if a defect is discovered post-release.
4. **Data Sanitization:** Production data must never be copied to lower environments unless fully anonymized and stripped of PII and sensitive financial details.

#### 9.6.3 Feature Flagging

1. All new tiers, major modules (e.g., OCR, API), and complex workflows must be deployed behind feature flags.
2. Feature flags must support environment-level and workspace-level targeting (e.g., enabling a beta feature only for specific Enterprise workspaces).
3. Feature flags must be cleaned up and removed from the codebase once the feature is fully rolled out and stable.

---

### 9.7 Post-Launch Evaluation & Iteration

After each phase launches, the product team must evaluate specific metrics to validate success and guide the next iteration.

#### 9.7.1 Phase 1 Evaluation Metrics

- **Ledger Accuracy:** Zero reported balance calculation errors.
- **Activation Rate:** Percentage of registered users who record at least 5 transactions in the first 7 days.
- **Trial Conversion:** Percentage of Solo trials that convert to paid subscriptions.
- **Context Usage:** Percentage of Solo users who actively use the Business context toggle.

#### 9.7.2 Phase 2 Evaluation Metrics

- **Collaboration Adoption:** Number of Team workspaces created and average member count per workspace.
- **Split/Settlement Volume:** Number of shared expenses split and settlements recorded per month.
- **Context Preference:** Ratio of Team workspaces using Household context vs. Small Team context.
- **Cross-Workspace Retention:** Retention rate of users who have both a Solo (Personal) and Team workspace.

#### 9.7.3 Phase 3 Evaluation Metrics

- **Seat Expansion:** Net new paid seats added to existing Business workspaces.
- **Workflow Efficiency:** Average time from expense submission to final approval.
- **API Adoption:** Number of Business/Enterprise workspaces generating active API keys and receiving webhook deliveries.
- **Enterprise Pipeline:** Number of Enterprise contracts closed and successful SSO/SCIM implementations.

---

## Appendix A: Product Owner Sign-Off Checklist

**Purpose:**
This checklist confirms that the PRD has been reviewed and approved for engineering, design, QA, and operations handoff.

### A1. Product Scope Sign-Off

| Item                                                             | Status             |
| ---------------------------------------------------------------- | ------------------ |
| Five-tier model is final: Free, Solo, Team, Business, Enterprise | Pending / Approved |
| Phase 1 scope is locked to Free and Solo                         | Pending / Approved |
| Phase 2 scope is locked to Team collaboration                    | Pending / Approved |
| Phase 3 scope is locked to Business and Enterprise governance    | Pending / Approved |
| Out-of-scope items are confirmed and documented                  | Pending / Approved |

### A2. Subscription and Billing Sign-Off

| Item                                              | Status             |
| ------------------------------------------------- | ------------------ |
| Pricing tiers are final                           | Pending / Approved |
| Trial rules are final                             | Pending / Approved |
| Grace period and retention rules are final        | Pending / Approved |
| Seat management rules are final                   | Pending / Approved |
| Team-to-Business conversion rules are final       | Pending / Approved |
| Payment provider compatibility has been validated | Pending / Approved |

### A3. Security and Privacy Sign-Off

| Item                                           | Status             |
| ---------------------------------------------- | ------------------ |
| Workspace isolation rules are approved         | Pending / Approved |
| RBAC model is approved                         | Pending / Approved |
| Audit trail requirements are approved          | Pending / Approved |
| Data retention and deletion policy is approved | Pending / Approved |
| Privacy export and deletion flows are approved | Pending / Approved |

### A4. UX Sign-Off

| Item                                        | Status             |
| ------------------------------------------- | ------------------ |
| Core user journeys are approved             | Pending / Approved |
| Read-only and suspended states are approved | Pending / Approved |
| Paywall and limit experience is approved    | Pending / Approved |
| Multi-currency display rules are approved   | Pending / Approved |
| Approval workflow UX is approved            | Pending / Approved |

### A5. Operational Readiness Sign-Off

| Item                                                   | Status             |
| ------------------------------------------------------ | ------------------ |
| Admin Console requirements are approved                | Pending / Approved |
| Support tooling requirements are approved              | Pending / Approved |
| Monitoring and alerting expectations are approved      | Pending / Approved |
| Backup and disaster recovery expectations are approved | Pending / Approved |
| Incident response expectations are approved            | Pending / Approved |

### Final Approval

| Role                         | Name | Date | Decision            |
| ---------------------------- | ---- | ---- | ------------------- |
| Product Owner                |      |      | Approved / Rejected |
| Engineering Lead             |      |      | Approved / Rejected |
| Design Lead                  |      |      | Approved / Rejected |
| QA Lead                      |      |      | Approved / Rejected |
| Security/Compliance Reviewer |      |      | Approved / Rejected |

---
