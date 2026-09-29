You are a senior React Native and mobile application architect.

Build Phase 1 of QuoteFlow as a LOCAL-FIRST mobile application.

QuoteFlow is a private mobile application for a software developer/freelancer to create project estimates, client proposals, PDF offers, manage clients, projects, portfolio, revenue, maintenance packages, technologies, services and professional profile information.

IMPORTANT:

Phase 1 must NOT require any backend server.

Do NOT use:

- Firebase database
- Supabase database
- PostgreSQL
- Node.js backend
- NestJS backend
- remote database

The application must work locally on the user's Android phone after installation.

The architecture MUST, however, be designed so Phase 2 can later introduce a NestJS + PostgreSQL backend, authentication, synchronization and SaaS functionality without rewriting the entire application.

---

# TECHNOLOGY

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- Expo SQLite
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Expo SecureStore
- Expo FileSystem where appropriate

Use strict TypeScript.

Code comments must be in English.

---

# LOCAL-FIRST ARCHITECTURE

SQLite is the primary database in Phase 1.

Create repository interfaces between application/domain logic and SQLite.

Example:

ProjectRepository

ClientRepository

EstimateRepository

ProposalRepository

TechnologyRepository

ServiceRepository

RevenueRepository

SettingsRepository

The UI and business logic must NOT directly depend on SQLite queries.

Implement SQLite repositories such as:

SQLiteProjectRepository

SQLiteClientRepository

SQLiteEstimateRepository

This is extremely important because Phase 2 will introduce API-backed repositories.

Business logic must remain reusable.

---

# LOCAL DATABASE

Design a normalized SQLite schema.

Include entities for:

Profile
Technology
Service
Client
Project
ProjectTechnology
Estimate
EstimateItem
Proposal
ProposalSection
MaintenancePackage
ProjectPayment
ProjectExpense
PortfolioProject
FileReference
AppSettings

Create proper migrations.

Never destroy user data during application upgrades.

Create a database migration version system.

---

# PROFILE

Allow the user to configure:

First name
Last name
Professional title
Professional summary
Email
Phone
Company
Website
Profile image
Company logo
Hourly rate
Currency
Tax rate
Default buffer percentage
Testing percentage
Project management percentage
Default payment terms

---

# TECHNOLOGIES

User can create technologies such as:

React
React Native
Next.js
Node.js
NestJS
WordPress
WooCommerce
PHP
PostgreSQL
Firebase
Docker
Google Cloud
AWS

Fields:

name
category
experienceLevel
yearsOfExperience
hourlyRateOverride
active

---

# SERVICES

Services are separate from technologies.

Examples:

Custom Development
Custom Theme
Plugin Development
API Integration
CRM Integration
Payment Integration
Authentication
UI Implementation
Deployment
Testing
Maintenance
Consulting

Each service can define:

defaultMinHours
defaultMaxHours
defaultPrice
hourlyRateOverride

---

# ESTIMATION ENGINE

This is a core feature.

Do NOT use AI as the primary pricing calculator.

Create deterministic pricing calculations.

Estimate items can contain:

technology
service
implementationType
complexity
minHours
maxHours
selectedHours
hourlyRate
calculatedPrice
manualPrice
notes

Implementation types:

CUSTOM
PLUGIN
THIRD_PARTY
EXISTING_SOLUTION
HYBRID

Complexity:

SIMPLE
STANDARD
COMPLEX
VERY_COMPLEX

Default multipliers:

SIMPLE = 0.8
STANDARD = 1
COMPLEX = 1.4
VERY_COMPLEX = 1.8

Make multipliers configurable.

Calculate:

Development hours
Testing
Project management
Deployment
Buffer
Total estimated hours
Internal calculated price
Final client price

Manual overrides must always take precedence.

Never overwrite a manual price automatically.

---

# CLIENTS

Client fields:

name
company
email
phone
website
country
industry
notes

Show client history:

Projects
Proposals
Revenue

---

# PROPOSALS

Proposal statuses:

DRAFT
SENT
ACCEPTED
REJECTED
EXPIRED

Proposal sections:

Executive Summary
Objectives
Proposed Solution
Scope
Deliverables
Technology Stack
Timeline
Investment
Maintenance
Exclusions
Terms
About
Relevant Projects
Next Steps

All content must be editable.

---

# PDF

Generate professional client PDF proposals locally whenever technically practical.

The PDF must support:

Company logo
Profile information
Client information
Proposal number
Date
Project title
Scope
Deliverables
Technology stack
Timeline
Pricing
Maintenance
Terms
Relevant projects

Create:

Internal Estimate

and separately:

Client Proposal

Never expose internal hourly calculations unless explicitly enabled by the user.

Allow sharing the generated PDF using the Android share sheet.

---

# PROJECTS

Project statuses:

LEAD
PROPOSAL
ACCEPTED
IN_PROGRESS
ON_HOLD
COMPLETED
CANCELLED

Fields:

title
client
description
privateNotes
startDate
endDate
technologies
services
estimatedHours
actualHours
estimatedPrice
finalPrice
actualRevenue
expenses
profit
currency
featuredImage

Accepted proposals should be convertible into projects.

---

# PORTFOLIO

Allow completed projects to become portfolio entries.

Store:

title
description
featuredImage
technologies
services
client
visibility settings

Revenue is private by default.

---

# REVENUE

Track:

Revenue
Expenses
Profit
Payments

Payment statuses:

PENDING
PARTIALLY_PAID
PAID
OVERDUE

Allow multiple payments per project.

---

# DASHBOARD

Show:

Revenue this month
Revenue this year
Active projects
Open proposals
Accepted proposals
Conversion rate
Average project value
Outstanding payments

Also:

Recent projects
Recent proposals

---

# MAINTENANCE PACKAGES

Create reusable packages.

Frequency:

NONE
MONTHLY
QUARTERLY
ANNUALLY
CUSTOM

Package fields:

name
description
monthlyPrice
annualPrice
includedHours
features

---

# AI

AI is OPTIONAL and requires internet.

The rest of the application must continue working without internet.

Create an AIProvider interface.

Support future providers:

OpenAI
Anthropic
Gemini

AI features:

Analyze project requirements
Suggest technologies
Suggest services
Generate Scope of Work
Generate proposal descriptions
Generate deliverables
Generate maintenance description
Improve proposal text
Parse CV

IMPORTANT:

AI results are suggestions.

Never automatically modify estimates, pricing or profile information.

Require user confirmation.

For Phase 1, allow the user to configure their own AI API key.

Store the key using Expo SecureStore.

Never store it in SQLite or source code.

Clearly document that direct provider API keys are acceptable only for private/local usage and MUST be replaced with server-side AI calls before public distribution.

---

# CV IMPORT

Allow selecting a CV document.

Support PDF initially.

Extract information through the configured AI provider.

Possible information:

Name
Professional title
Summary
Experience
Companies
Projects
Technologies
Skills
Education
Languages
Certifications

Display:

Review Imported Information

The user individually selects which information should be imported.

Never automatically overwrite profile data.

---

# BACKUP

This is mandatory.

Create:

Settings → Data & Backup

Features:

Create Backup
Export Backup
Import Backup
Last Backup Date

Backup must include:

SQLite database/data
settings
project metadata
proposal data
portfolio metadata

Where feasible include associated local files or provide a documented strategy for bundling/restoring them.

Use a versioned backup format.

Example:

quoteflow-backup-v1-2026-09-28.zip

Restoring a backup must validate the backup version and integrity before modifying current data.

Never silently destroy current data.

---

# LOCAL SECURITY

Allow optional application lock.

Support:

Device biometrics when available
PIN fallback

Sensitive configuration must use SecureStore.

---

# MOBILE UX

Build a professional mobile-first interface.

Use:

Bottom navigation
Cards
Bottom sheets
Search
Filters
Skeleton loading
Empty states
Confirmation dialogs
Responsive forms

Primary navigation:

Dashboard
Clients
Estimates
Projects
More

More:

Proposals
Portfolio
Revenue
Maintenance
Profile
Settings

---

# FUTURE SAAS REQUIREMENT

Phase 1 MUST prepare for Phase 2.

Do not couple UI components to SQLite.

Create domain models and repository interfaces.

The future architecture will be:

React Native UI
↓
Repository interfaces
↓
Local repositories OR API repositories
↓
NestJS API
↓
PostgreSQL

Do not implement the server now.

---

# DOCUMENTATION — CRITICAL

Create:

docs/LOCAL_INSTALLATION.md

The document must explain EXACTLY how I can install QuoteFlow on my personal Android phone.

Include:

1. Required software on development computer
2. Node.js installation/version requirements
3. npm/pnpm requirements
4. Expo account setup if needed
5. Android development requirements
6. Environment variables
7. How to configure AI API keys
8. How to run locally during development
9. How to test using Expo Go when possible
10. Explain when Expo Go is insufficient
11. How to create an Expo Development Build
12. How to generate an Android APK
13. How to install the APK directly on my Android phone
14. Android permissions required for installation
15. How to create a production/release build without publishing to Google Play
16. Where application data is stored
17. How SQLite data survives application restarts
18. What happens if the application is uninstalled
19. How to create a backup before uninstalling
20. How to restore the application on a new phone

Create another document:

docs/APP_UPDATES.md

Explain EXACTLY how I update my personal installed application.

Cover two scenarios.

SCENARIO A — JavaScript-only compatible update

Explain whether Expo/EAS Update can be used and how.

Provide exact commands.

Explain limitations.

SCENARIO B — Native dependency/application update

Explain how to:

increment app version
increment Android versionCode
create a new APK/build
install the new version over the existing application

CRITICAL:

Installing an update must preserve SQLite user data.

Document package/application identifiers and signing requirements so future builds install as updates instead of separate applications.

Explain that changing signing keys or application IDs can prevent an in-place update.

Explain how signing credentials must be safely backed up.

Create:

docs/BACKUP_AND_RESTORE.md

with exact backup and recovery instructions.

Create:

docs/ARCHITECTURE.md

explaining how Local Phase 1 transitions to SaaS Phase 2.

---

# TESTING

Write unit tests for:

Estimation calculations
Complexity multipliers
Manual price overrides
Revenue calculations
Profit calculations

Test SQLite migrations.

Test backup validation.

---

# IMPLEMENTATION ORDER

Do not attempt everything at once.

First provide:

1. Proposed architecture
2. Folder structure
3. SQLite schema
4. Repository architecture
5. Migration strategy
6. Backup strategy
7. Expo build/install strategy
8. Future SaaS migration strategy

After presenting these, begin implementation in logical phases.

Do not introduce a backend server during Phase 1.
