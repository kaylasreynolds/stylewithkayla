# Cloudflare pull-request previews

Pull requests from branches in this repository that target `Combined` deploy to
an isolated Worker named `stylewithkayla-pr-<PR number>`. Wrangler's deployment
output is the authoritative `workers.dev` URL. Pull requests from forks are not
deployed because GitHub must not expose Cloudflare credentials to untrusted
code.

Each Worker uses the shared `stylewithkayla-preview` D1 database and the shared
`stylewithkayla-photo-assets-preview` R2 bucket. Preview events, RSVPs,
appointments, contact submissions, and images are therefore visible across all
open PR previews. Closing a PR deletes only its Worker; it does not delete or
empty either shared resource.

Preview Workers do not have a `CONTACT_EMAIL` binding. Contact submissions are
stored in preview D1 with `notificationStatus` set to `unavailable`, and no
email is delivered.

## GitHub configuration

Configure these Actions secrets:

- `CLOUDFLARE_API_TOKEN`: a scoped token that can deploy and delete Workers,
  apply migrations to the preview D1 database, and bind the preview R2 bucket.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account containing the preview
  resources.

No additional GitHub variables are required because the confirmed preview
resource identifiers are non-secret configuration in `wrangler.preview.jsonc`.
The workflow's `GITHUB_TOKEN` posts and updates the preview comment.

## Required Cloudflare Access configuration

Cloudflare Access configuration is account-side and is not created by the
deployment workflow. Before using an admin preview:

1. In Cloudflare Zero Trust, create self-hosted Access applications that match
   the preview Worker hostnames. Cover the dynamically deployed
   `stylewithkayla-pr-<number>.<workers-subdomain>.workers.dev` hosts using the
   account's supported wildcard-hostname configuration, or add equivalent
   applications for each active preview Worker.
2. Protect `/admin/*` and `/api/admin/*`. Keep `/` and `/events` outside the
   protected application paths so public preview testing does not require a
   login.
3. Add an Allow policy for `kaylasreynolds@gmail.com` and require the desired
   identity provider and MFA controls. Do not configure a Bypass policy.
4. Confirm that Access forwards the authenticated identity in the
   `Cf-Access-Authenticated-User-Email` header. The application independently
   checks that value against its preview `ADMIN_EMAILS` allowlist.
5. Open both admin links from the workflow's PR comment and verify that an
   unauthenticated browser is sent through Access, the approved account can
   sign in, and another account is denied.

The public and admin path applications may need separate path entries depending
on the Cloudflare dashboard's wildcard support. Do not protect the entire
`workers.dev` hostname if `/` and `/events` must remain public.

## Lifecycle and safety

The workflow runs migrations only through `wrangler.preview.jsonc`, deploys
with a per-PR Worker name, and omits production domains and email bindings. On a
same-repository PR close, cleanup deletes that exact per-PR Worker. Production
Worker, D1, R2, routes, email, and the shared preview storage resources are not
cleanup targets.
