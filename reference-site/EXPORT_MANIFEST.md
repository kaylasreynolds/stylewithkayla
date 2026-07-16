# Style With Kayla Private Prototype Export

Exported: 2026-07-14

Source checkout: `/workspace/sites/style-with-kayla-booking-mockup`

Source commit: `96d40ee2a72925ef71a92c856935c725f0d0b338`

## Contents

- `repository/`: complete source checkout with `.git` history included.
- `repository/.env.example`: required configuration names with no secret values.
- `STYLE_WITH_KAYLA_FULL_HISTORY.bundle`: full Git bundle created with all refs as a second restore path.

## Included Source Areas

- Frontend and backend application source.
- D1 schema and migrations.
- Booking submission and protected admin approval flow code.
- Privacy Operations code.
- `docs/DECISIONS.md`.
- `docs/OPERATIONS.md`.
- `docs/D1_SCHEMA_AND_API_CONTRACT.md`.
- `lib/server/profile-policy.ts`.
- Tests and validation scripts.
- `.openai/hosting.json` deployment configuration.
- Full local Git history in `repository/.git`.

## Exclusions

The export excludes generated or disposable folders that were not tracked source:

- `node_modules/`
- `.sites-runtime/`
- `dist/`
- `.next/`
- `.wrangler/`
- `.vite/`
- `coverage/`
- `*.tsbuildinfo`

No non-ignored untracked files were present in the source checkout at export time.

## Restore

Use `repository/` directly as a working tree, or restore the history bundle with:

```sh
git clone STYLE_WITH_KAYLA_FULL_HISTORY.bundle style-with-kayla-restored
```

After restoring, install dependencies from `package-lock.json` with `npm ci`.
