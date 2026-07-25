const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";

function normalizeEmail(value: string | null | undefined): string | null {
  return value?.trim().toLowerCase() || null;
}

export function resolveAccessEmail(
  requestHeaders: Headers,
  options: {
    allowLocalFallback: boolean;
    localAdminEmail: string | null;
  },
): string | null {
  const accessEmail = normalizeEmail(
    requestHeaders.get(ACCESS_EMAIL_HEADER),
  );

  if (accessEmail) {
    return accessEmail;
  }

  return options.allowLocalFallback
    ? normalizeEmail(options.localAdminEmail)
    : null;
}
