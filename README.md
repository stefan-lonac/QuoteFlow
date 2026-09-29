# QuoteFlow

A private, local-first workspace for independent developers. Expo / React Native / TypeScript, with SQLite on Android and a browser preview.

## Start

~~~powershell
npm ci
npm run web
~~~

For Android development: `npm run start:go` with the SDK 57-compatible Expo Go, or `npm start -- --dev-client` with your own SDK 57 development build.

The first launch is empty. **Explore with sample data** adds fictional clients and projects only after confirmation. Set your profile under **More → Your profile**.

## Included

- Animated dark interface, responsive sidebar/bottom navigation, searchable cards and editable sheets.
- Clients, projects, estimates, proposal sections, technologies, services, maintenance, portfolio, payments and expenses.
- Deterministic pricing, complexity preferences, line and final price overrides.
- Local client/internal PDFs; client PDFs exclude internal calculations by default.
- Versioned backups with SHA-256 integrity, bundled images and transactional restore.
- Android SecureStore, optional PIN/biometric lock, optional OpenAI writing and PDF CV import.
- Repository boundaries for a future API adapter; no backend required.

## Verify

~~~powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run build:android:bundle
~~~

Browser tests need Chromium: `npx playwright install chromium`. Node 24 runs the SQLite migration tests. Android bundle export verifies JavaScript/Hermes compilation; it does **not** create an APK or verify device APIs.

## Guides

- [Install on your Android phone](docs/LOCAL_INSTALLATION.md)
- [Update an installed app](docs/APP_UPDATES.md)
- [Backup and recovery](docs/BACKUP_AND_RESTORE.md)
- [Architecture and Phase 2](docs/ARCHITECTURE.md)
- [Verification and device checklist](docs/TESTING.md)

The UI is English. Browser data stays in that browser and is separate from Android SQLite. AI keys and biometrics are Android-only. OpenAI is implemented; Anthropic and Gemini are extension points. APK signing/account setup and physical-device verification must be completed on your machine/phone.

