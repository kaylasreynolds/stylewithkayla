# Style With Kayla — Private Prototype Operations

This runbook covers the protected booking prototype. It does not authorize changes to the public marketing repository.

## Daily review

1. Open `/admin` and review pending requests, especially the Overdue indicator.
2. Confirm, decline, release, or propose another available time. A client is never confirmed by public submission alone.
3. Open `/admin/privacy` and review open access, correction, and deletion requests.
4. Use the availability page for one-off closures or added routine windows.

## Privacy requests

Client requests arrive through direct contact with Kayla. Record each request in `/admin/privacy` using the email already stored in D1.

- Access: download the client data export, deliver it through an approved private channel, then record the resolution.
- Correction: make the correction using the audited booking/Profile controls, then record the resolution.
- Deletion: first decline or cancel every active appointment. The final delete action removes booking, profile, token, communication, and calendar-link records, anonymizes the minimal client row, and retains a minimal request audit.

Never paste private Style Profile answers or access links into the resolution note.

## Retention maintenance

The protected maintenance operation does two things:

1. Revokes private links after their expiry time.
2. Deletes written client data once its approved two-calendar-year retention date has passed, provided the client has no active appointment and no unresolved access/correction request.

Kayla can preview the counts and run maintenance from `/admin/privacy`. The same idempotent operation is called by the GitHub Actions workflow proposed in `kaylasreynolds/stylewithkayla` pull request 32. Scheduled calls require both the private Sites dispatch bypass token and a separate `MAINTENANCE_SECRET` bearer token. They are stored only as the encrypted repository secrets `SWK_SITES_BYPASS_TOKEN` and `SWK_MAINTENANCE_SECRET`; neither value belongs in source control.

The proposed schedule is daily at `10:15 UTC`, which runs overnight at 3:15 AM Boise standard time or 4:15 AM Boise daylight time. The trigger is not active until pull request 32 is merged, both repository secrets are provisioned, the matching maintenance secret is configured in Sites, and one manual workflow run succeeds. Run the admin operation after each release and at least monthly until activation is verified.

## Cloudflare Worker preview

This branch is configured only for a separate Workers preview. It must not be attached to `stylewithkayla.com`, used to modify DNS, or treated as the production marketing site.

### Dashboard values

| Cloudflare field | Value |
|---|---|
| Project type | Workers & Pages → Create application → Worker → Import a repository |
| Repository | `kaylasreynolds/stylewithkayla` |
| Production branch for this preview project | `recovered-private-prototype-2026-07-14` |
| Root directory | `/` |
| Build command | `npm ci && npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.jsonc` |
| Worker name | `stylewithkayla-private-preview` |
| Worker entry point | `dist/server/index.js` |
| Static assets directory | `dist/client` |
| Static assets binding | `ASSETS` |
| D1 binding name | `DB` |
| D1 database name | `stylewithkayla-private-preview` |
| D1 migrations directory | `migrations` |

The committed `database_id` is an intentional all-zero placeholder. After manually creating a preview-only D1 database, replace that placeholder in the preview project's configuration with the actual preview database ID before deploying.

### Required runtime configuration

Configure these only in the Worker project under **Settings → Variables and Secrets**:

- `ADMIN_EMAILS`: encrypted secret or server-side text variable containing the authorized admin email list in the format expected by the application.
- `MAINTENANCE_SECRET`: encrypted secret used by the protected maintenance endpoint.

Do not prefix either name with `NEXT_PUBLIC_`, do not place values in source control, and do not add them as client-side build variables. `.env.example` contains names only for local setup documentation.

The Worker also requires these non-secret resource bindings:

- D1 database binding `DB`.
- Static asset binding `ASSETS`, provided by Wrangler from `dist/client`.
- Cloudflare Images binding `IMAGES`, used by the vinext image optimization route.

### Preview database and migrations

Create a dedicated preview database manually, then update only the preview configuration:

```bash
npx wrangler d1 create stylewithkayla-private-preview
# Copy the returned database_id into wrangler.jsonc.
npx wrangler d1 migrations apply stylewithkayla-private-preview --remote --config wrangler.jsonc
```

The migration command can also be run as:

```bash
npm run db:migrate:preview
```

Never point the preview Worker at a production D1 database or copy production client data into it.

### Local verification and deployment

```bash
npm ci
npm run build
npm test
npm run validate:artifact
npm run dev
```

Deployment is deliberately manual:

```bash
npm run deploy:preview
```

That command builds and deploys the separate Worker named `stylewithkayla-private-preview`. Do not run it until the preview D1 binding and runtime secrets have been configured.

## Release verification

Before accepting a release:

- Run lint, TypeScript, production build, and automated tests.
- Confirm the site remains owner-only.
- Confirm routine availability still reports `routine_only` until Outlook is deliberately connected.
- Exercise one synthetic request through pending, proposed/confirmed, Profile, completed, and privacy deletion states. Use an `@example.com` address and remove it through the privacy workflow afterward.
- Check that a duplicate or overlapping request receives a slot-unavailable response.
- Check expired/revoked private links return an unavailable state without revealing client data.

## Backup and recovery

Sites deployments are immutable source checkpoints, not database backups. Before a risky data migration or provider integration, export the affected client/booking records through the protected admin downloads and confirm the D1 backup/restore procedure offered by the hosting platform at that time. Never store exports in the public repository.

If a release fails, leave the last successful private deployment in place, correct the source, rerun validation, and publish a new checkpoint. Do not bypass access controls or copy production client data into local fixtures.
