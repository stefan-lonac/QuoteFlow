# Verification

## Automated checks

- `npm run typecheck`: strict TypeScript, including unchecked indexed access.
- `npm test`: deterministic estimates, every multiplier, zero/manual overrides, invalid numbers, revenue/profit/status, backup roundtrip/integrity/schema/relationships/files, form validation, real SQLite schema/migration persistence and rollback.
- `npm run build`: Expo production web export.
- `npm run test:e2e`: browser create/reload/search, estimate override, proposal generation, PDF internal-data exclusion, backup export/validation, responsive navigation.
- `npm run build:android:bundle`: Android Metro/Hermes compilation, not an APK.

The migration tests execute real SQLite through Node 24's node:sqlite adapter. They do not emulate Android SecureStore or exercise the native SQLite bridge.

Browser screenshots are stored in artifacts/. Browser test data is isolated and fictional. The app starts empty for normal users.

## Required physical Android checks

An APK has not been built or installed by this workspace task. Build credentials/account setup are user-specific. Before trusting the application with your only copy of business data, verify on your phone:

1. Install preview APK, create client/project/estimate; force-stop/reopen in airplane mode.
2. Add estimate items with zero and positive manual overrides; change complexity and confirm override remains.
3. Export internal PDF and client PDF; inspect the actual files, logo, Unicode and page breaks. Confirm no internal rates without opt-in.
4. Use Android share sheet to save PDF/backup outside the app.
5. Select profile/logo/project images; restart and verify persistence.
6. Export backup, change a record, restore; inspect rows/images and recovery copy.
7. Import a deliberately damaged copy and verify refusal with no modification.
8. Enable PIN, background/foreground, try incorrect PINs and biometrics; test unavailable/enrollment-changed biometrics with PIN fallback.
9. With app lock enabled, use image/document picker and share sheet, unlock and confirm the in-progress form still works.
10. Configure your own AI key, approve a request, test offline/error/cancel behavior, and individually review a PDF CV import. No real paid API request was executed during automated verification.
11. Install a higher-versionCode APK with the same ID/signing key over the old APK; verify data and images survive.
12. Verify EAS Update only after configuring your EAS project, URL, channel and installing a build containing them.

## Limits

Browser uses localStorage, not SQLite or SecureStore. Browser printing opens a printable proposal window and depends on the browser's Save as PDF; Android uses expo-print and expo-sharing. Device biometrics, Android PDF rendering, installation, signing and real AI responses require the checks above. Financial reports are receipts-based; create a separate payment for each installment date. No exchange-rate conversion or recurring billing automation is implied.

