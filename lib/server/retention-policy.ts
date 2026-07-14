export const ACTIVE_BOOKING_STATUSES = ["pending", "change_proposed", "confirmed"] as const;

export type RetentionCandidate = {
  retentionDeleteAfter: number | null;
  activeBookingCount: number;
  openAccessOrCorrectionCount: number;
};

export function isRetentionEligible(candidate: RetentionCandidate, now = Date.now()) {
  return candidate.retentionDeleteAfter !== null
    && candidate.retentionDeleteAfter <= now
    && candidate.activeBookingCount === 0
    && candidate.openAccessOrCorrectionCount === 0;
}

export function anonymizedClientEmail(clientId: string) {
  return `deleted+${clientId.toLowerCase().replace(/[^a-z0-9-]/g, "")}@invalid.local`;
}

