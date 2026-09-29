# Architecture

## Phase 1

QuoteFlow has no application backend. Installed Android builds run with no server. The browser adapter exists to preview and verify the interface.

~~~text
app/                      Expo Router screens
src/components/           Shared UI, forms, details, navigation, lock gate
src/domain/catalog.ts     Entity field contracts / relationships
src/domain/repositories.ts Repository and DataStore interfaces
src/domain/calculations.ts Pure deterministic estimation and finance
src/domain/validation.ts  Zod form/domain validation
src/domain/backup.ts      Versioned backup validation and integrity
src/data/schema.ts        Ordered migrations and schema version
src/data/store.ts         SQLite repositories (Android)
src/data/store.web.ts     Browser-only localStorage adapter
src/data/context.tsx      Repository injection / TanStack Query
src/services/             Files, PDF, AI, SecureStore
src/state.ts              Ephemeral Zustand UI state
tests/                    Domain, backup and SQLite tests
e2e/                      Browser workflow verification
~~~

Screens consume repository interfaces through a provider, never SQL. TanStack Query owns the loaded workspace snapshot and invalidation. Zustand owns ephemeral notifications and lock state. React Hook Form with Zod handles forms. The generic field catalog drives forms and normalized scalar columns; relation fields become foreign keys. Derived financial values are calculated instead of duplicated.

For a small private workspace one snapshot query is deliberately simple. Large datasets will require paginated repository queries and more granular query keys; that can happen without changing the pricing functions.

## SQLite schema and relationships

Every row has a UUID, createdAt and updatedAt. Times use ISO strings; business dates use YYYY-MM-DD. Money is rounded to two decimals at calculation boundaries. Persisted numeric inputs are finite and non-negative. Currency is explicit and mixed currencies are never summed or converted.

| Table | Role / relationships |
| --- | --- |
| profile | Single professional profile, pricing defaults, local image references |
| technologies | Independent technology catalog and rate overrides |
| services | Service catalog, default hour ranges, fixed/rate defaults |
| clients | Contact and business details |
| projects | Client FK, status, hours, agreed prices, private notes |
| projectTechnologies | Project ↔ technology junction |
| projectServices | Project ↔ service junction |
| estimates | Client/project FK, overhead percentages and nullable price override |
| estimateItems | Estimate/service/technology FK, implementation, complexity, hours/rate, nullable override |
| proposals | Client/estimate/maintenance/project FK, independent agreed client price |
| proposalSections | Proposal FK, editable ordered sections |
| maintenance | Reusable packages and billing frequency |
| payments | Project FK, due/received amount, receipt/due date, currency |
| expenses | Project FK, amount/date/currency |
| portfolio | Project/client FK, visibility and revenue visibility |
| files | Imported persistent local attachments |
| settings | Non-secret preferences, last backup and reviewed CV notes |

Project revenue/expenses/profit and payment statuses are derived from transactions. Portfolio technology/service context is obtained from its linked project. Image paths are backed by FileReference rows for portability. Profile is a single logical record enforced through the profile screen and backup validator.

**PRIVATE/PUBLIC portfolio visibility is metadata only.** There is no public server or publishing in Phase 1. Setting PUBLIC does not upload anything.

## Migration strategy

PRAGMA user_version tracks schema version. Startup enables foreign keys and WAL, checks for a newer unsupported version, and applies missing migrations in ordered transactions. It never drops/recreates an existing database on startup.

Version 1 SQL is frozen in src/data/migrations/001.ts, independently of future catalog changes. Append explicit versioned migrations; never edit the meaning of a migration that has shipped. Prefer additive columns/tables and backfills; test a database containing real-shaped old records, rollback on error and repeat startup. Future migration failures must keep the previous data recoverable.

FK deletion is restricted, so deleting a referenced client/project fails with an explanation. Children are removed explicitly after confirmation. Snapshot restore uses deferred FK checks in one transaction, preserving relational integrity even with cyclic proposal/project references.

## Estimation

1. Selected item hours × configurable complexity multiplier.
2. Item price = manual price if present (including zero), otherwise adjusted hours × item rate.
3. Testing and management are percentages of development hours.
4. Deployment is explicit hours.
5. Buffer is a percentage of development + testing + management + deployment hours.
6. Internal price sums item prices plus overhead hours × estimate default rate.
7. A nullable estimate override replaces the pre-tax subtotal; tax is explicitly added afterward.
8. No calculation mutates persisted inputs or clears manual prices.

Selecting a service copies its hour defaults and optional hourly rate. A fixed default price fills a blank manual-price field only. Selecting a technology applies its optional hourly rate. Users can edit all inputs. The implementation type is descriptive, not an undocumented pricing multiplier.

Creating a proposal snapshots the final estimate amount into proposal.price. Later estimate edits do not silently change an existing client offer. Accepted proposals convert once into a linked project. Completed projects can become private portfolio entries.

## Backup and security

Versioned JSON contains every table and base64 attachments, with SHA-256 integrity. Validation precedes confirmation and writing. Restore creates a recovery copy and rewrites local file paths before committing the database transaction. See BACKUP_AND_RESTORE.md.

SecureStore contains provider keys, PIN salt/hash, and throttled failure counters. PIN supports 6–12 digits and exponential-ish lockout after repeated failures. Device biometrics are an alternate unlock path. App lock is an interface access control, not database encryption. Native OS app storage protection remains important.

The lock overlay hides app sheets while locked and preserves mounted form state when Android opens a document picker/share sheet. API keys are never included in backups or bundled source. AI is a separate optional service with explicit consent to transmit and a second review step before importing. Only OpenAIProvider is implemented; the provider interface reserves Anthropic/Gemini adapters.

## Phase 2: NestJS + PostgreSQL

Introduce API-backed implementations behind the same Repository/DataStore interfaces and inject them at the provider boundary. Keep domain calculations and validation reusable in a shared package. Do not put SQL, fetch calls, auth tokens or provider-specific pricing in screens.

Before synchronization, add explicit versioned migrations for tenant/user IDs, server revision, sync status, tombstones and an outbox. UUIDs remain stable during migration. Define conflicts per entity: proposal prices and manual overrides must never be silently overwritten. Use optimistic concurrency and explicit merge/review for conflicts.

Use local SQLite as the offline cache and transactional outbox; sync jobs push/pull authenticated API changes. API transactions must replace the current local transaction contract for proposal conversions and restores. Large file attachments move through an authenticated upload service, retaining stable IDs and local cached URIs.

Move AI provider credentials and calls to the server before public release. Authenticate users, enforce tenant ownership on the server, add rate limiting/audit trails and explicit data export/delete. Introduce online/offline state and sync error resolution only once an actual synchronization service exists.

No NestJS server, PostgreSQL instance, remote database, auth or sync was created in Phase 1.

