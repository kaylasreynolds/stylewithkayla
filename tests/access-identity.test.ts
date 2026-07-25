import assert from "node:assert/strict";
import test from "node:test";
import { resolveAccessEmail } from "../lib/access-identity";

test("Cloudflare Access identity is authoritative over the local fallback", () => {
  const headers = new Headers({
    "cf-access-authenticated-user-email": " Access.User@Example.com ",
  });

  assert.equal(
    resolveAccessEmail(headers, {
      allowLocalFallback: true,
      localAdminEmail: "local@example.com",
    }),
    "access.user@example.com",
  );
});

test("local admin identity requires both development mode and an explicit email", () => {
  const headers = new Headers();

  assert.equal(
    resolveAccessEmail(headers, {
      allowLocalFallback: true,
      localAdminEmail: " Local.Admin@Example.com ",
    }),
    "local.admin@example.com",
  );
  assert.equal(
    resolveAccessEmail(headers, {
      allowLocalFallback: true,
      localAdminEmail: null,
    }),
    null,
  );
  assert.equal(
    resolveAccessEmail(headers, {
      allowLocalFallback: false,
      localAdminEmail: "local@example.com",
    }),
    null,
  );
});
