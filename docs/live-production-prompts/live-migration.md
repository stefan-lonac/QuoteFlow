The existing QuoteFlow React Native + Expo application is a working local-first application using SQLite and repository interfaces.

DO NOT rebuild the mobile application from scratch.

We are now starting Phase 2: convert QuoteFlow into a production SaaS product that can be distributed to paying customers.

Preserve all existing functionality.

# TARGET ARCHITECTURE

React Native + Expo
↓
Repository / Data Layer
↓
Local SQLite + Sync Layer
↓
NestJS REST API
↓
PostgreSQL

Use:

Backend:

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma

Mobile:

- existing React Native + Expo application
- TanStack Query
- existing SQLite database for local/offline data

# AUTHENTICATION

Introduce real user accounts.

Support:

Google authentication
Email authentication if appropriate
Access tokens
Refresh tokens
Secure token storage
Logout
Account deletion

Never store OAuth secrets in the mobile application.

# MULTI-TENANCY

Introduce:

User
Organization
OrganizationMember

Roles:

OWNER
ADMIN
MEMBER

All SaaS business data must belong to an organization/workspace where appropriate.

Prepare authorization guards so one organization can never access another organization's data.

# DATABASE

Translate the existing SQLite domain model into PostgreSQL/Prisma models.

Preserve stable entity IDs wherever possible.

Create migration/import functionality that uploads a user's existing local QuoteFlow data to their new cloud account.

Do not create duplicates.

Design conflict handling.

# SYNC

QuoteFlow should remain local-first where practical.

Implement synchronization between local SQLite and the server.

Track fields such as:

id
createdAt
updatedAt
deletedAt
syncStatus
serverVersion

Handle:

local changes
remote changes
offline edits
reconnection
soft deletes
sync conflicts

Do not implement naive last-write-wins for financially important conflicting changes without detecting the conflict.

# BACKEND MODULES

Create NestJS modules:

Auth
Users
Organizations
Profiles
Clients
Technologies
Services
Estimates
Proposals
Projects
Portfolio
Maintenance
Revenue
Payments
Files
AI
CVImport
Analytics
Subscriptions
Sync

Use DTO validation.

Use API versioning:

/api/v1/

# AI SECURITY

REMOVE direct AI provider calls containing private platform API keys from the production mobile application.

Architecture:

Mobile
→ QuoteFlow API
→ AI Provider

Store provider secrets only on the server.

Implement:

rate limiting
usage tracking
AI request logging
token/cost tracking
per-plan AI limits

Keep the existing AIProvider abstraction.

# FILE STORAGE

Move cloud files to managed object storage.

Support:

profile images
logos
project images
CVs
proposal PDFs

Use signed URLs where appropriate.

Validate:

MIME type
file size
authorization

# PDF

Support server-side PDF generation.

Preserve local PDF generation where useful.

Store generated proposal versions.

Allow users to regenerate and download/share proposals.

# SUBSCRIPTIONS

Prepare QuoteFlow for paid plans.

Create:

Subscription
Plan
PlanFeature
UsageRecord

Example plans:

FREE
PRO
AGENCY

Do not hardcode feature checks throughout UI components.

Create a centralized entitlement/feature system.

Examples:

maxClients
maxProjects
monthlyAIRequests
PDFTemplates
customBranding
teamMembers
cloudStorage
analytics

Integrate a payment provider through an abstraction.

Do not tightly couple domain logic to one payment provider.

# SECURITY

Implement:

rate limiting
request validation
authorization guards
organization isolation
secure headers
audit logging for sensitive operations
secure uploads
secret management
database backups

Never trust organizationId/userId sent by the client without validating membership server-side.

# OBSERVABILITY

Add:

structured logging
error tracking abstraction
health endpoint
API metrics
AI usage metrics

Create:

/health

# PRODUCTION

Provide Docker configuration for the NestJS API.

Provide production environment configuration.

Create:

.env.example

Never commit real secrets.

Create separate environments:

development
staging
production

# DEPLOYMENT DOCUMENTATION

Create:

docs/SAAS_DEPLOYMENT.md

Explain exactly:

How to provision PostgreSQL
How to deploy NestJS
How to configure environment variables
How to configure production domains
How to configure HTTPS
How to configure Google OAuth
How to configure object storage
How to configure AI providers
How to run Prisma migrations
How to configure backups
How to deploy staging
How to deploy production
How to rollback
How to monitor the API

# MOBILE RELEASE

Create:

docs/STORE_RELEASE.md

Cover:

Android Google Play
iOS App Store
Expo EAS Build
EAS Submit
application signing
production environment variables
versioning
OTA updates
native updates

# LOCAL USER MIGRATION

This is critical.

Existing Phase 1 users may have years of local QuoteFlow data.

Create an onboarding process:

"Enable QuoteFlow Cloud"

1. User creates/logs into account.
2. Local database is analyzed.
3. Show number of records that will be uploaded.
4. Create cloud workspace.
5. Upload local records.
6. Upload associated files.
7. Verify server data.
8. Mark records as synchronized.
9. Never delete local data automatically.

Migration must be resumable if internet connection fails.

# SAAS ADMIN

Create an administration system/API for:

users
organizations
subscriptions
usage
AI usage
storage usage
account status

Prepare for a separate web admin application later.

# COST CONTROL

Track resource-intensive operations.

Especially:

AI requests
file storage
PDF generation
bandwidth

Implement configurable limits.

Prevent one user from generating uncontrolled infrastructure or AI costs.

# TESTING

Add:

unit tests
integration tests
authorization tests
organization isolation tests
sync tests
migration tests
subscription entitlement tests
AI usage limit tests

# IMPLEMENTATION STRATEGY

Do NOT start by rewriting the mobile application.

First analyze the existing repository and report:

1. Current architecture
2. Repository abstractions
3. SQLite schema
4. Technical debt that would block SaaS
5. PostgreSQL schema proposal
6. Authentication design
7. Multi-tenancy design
8. Sync protocol
9. Local-to-cloud migration design
10. Infrastructure architecture
11. Security risks
12. Estimated migration phases

Then implement Phase 2 incrementally.

The existing local application must continue working throughout the migration.
