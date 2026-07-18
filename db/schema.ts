import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type BookingStatus =
  | "pending"
  | "change_proposed"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type ProfileType =
  | "under_40"
  | "over_40"
  | "womens_styling"
  | "womens_event"
  | "mens_styling"
  | "mens_event";

export type ProfileStatus = "draft" | "submitted" | "reopened";
export type ActorType = "client" | "admin" | "system";
export type JsonRecord = Record<string, unknown>;

const createdAt = () =>
  integer("created_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    phone: text("phone").notNull(),
    normalizedPhone: text("normalized_phone"),
    lastCompletedAppointmentAt: integer("last_completed_appointment_at"),
    retentionDeleteAfter: integer("retention_delete_after"),
    deletionRequestedAt: integer("deletion_requested_at"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("clients_normalized_email_unique").on(table.normalizedEmail),
    index("clients_normalized_phone_idx").on(table.normalizedPhone),
    index("clients_retention_delete_after_idx").on(table.retentionDeleteAfter),
  ],
);

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    audience: text("audience").$type<"women" | "men">().notNull(),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    routingMode: text("routing_mode")
      .$type<"age" | "womens_event" | "mens_styling" | "mens_event">()
      .notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex("services_code_unique").on(table.code)],
);

export const bookingSettings = sqliteTable("booking_settings", {
  id: text("id").primaryKey(),
  timezone: text("timezone").notNull().default("America/Boise"),
  minimumNoticeMinutes: integer("minimum_notice_minutes").notNull().default(1440),
  bookingHorizonDays: integer("booking_horizon_days").notNull().default(60),
  pendingOverdueMinutes: integer("pending_overdue_minutes").notNull().default(1440),
  calendarConflictCheckEnabled: integer("calendar_conflict_check_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const availabilityRules = sqliteTable(
  "availability_rules",
  {
    id: text("id").primaryKey(),
    weekday: integer("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    timezone: text("timezone").notNull().default("America/Boise"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("availability_rules_window_unique").on(
      table.weekday,
      table.startMinute,
      table.endMinute,
    ),
  ],
);

export const availabilityOverrides = sqliteTable(
  "availability_overrides",
  {
    id: text("id").primaryKey(),
    kind: text("kind").$type<"available" | "unavailable">().notNull(),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    note: text("note"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
  },
  (table) => [
    index("availability_overrides_range_idx").on(table.startsAt, table.endsAt),
  ],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    publicReference: text("public_reference").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    status: text("status").$type<BookingStatus>().notNull().default("pending"),
    requestedStartAt: integer("requested_start_at").notNull(),
    requestedEndAt: integer("requested_end_at").notNull(),
    proposedStartAt: integer("proposed_start_at"),
    proposedEndAt: integer("proposed_end_at"),
    confirmedStartAt: integer("confirmed_start_at"),
    confirmedEndAt: integer("confirmed_end_at"),
    returningClient: integer("returning_client", { mode: "boolean" }).notNull(),
    howHeard: text("how_heard").notNull(),
    ageRange: text("age_range").$type<"under_40" | "40_plus" | "manual_review">(),
    profileType: text("profile_type").$type<ProfileType>(),
    eventType: text("event_type"),
    eventDate: text("event_date"),
    bookingNotes: text("booking_notes"),
    adminNotes: text("admin_notes"),
    privacyPolicyVersion: text("privacy_policy_version").notNull(),
    privacyAcknowledgedAt: integer("privacy_acknowledged_at").notNull(),
    pendingSince: integer("pending_since").notNull(),
    confirmedAt: integer("confirmed_at"),
    declinedAt: integer("declined_at"),
    cancelledAt: integer("cancelled_at"),
    completedAt: integer("completed_at"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("bookings_public_reference_unique").on(table.publicReference),
    index("bookings_client_idx").on(table.clientId),
    index("bookings_status_pending_idx").on(table.status, table.pendingSince),
    index("bookings_requested_range_idx").on(
      table.requestedStartAt,
      table.requestedEndAt,
    ),
    index("bookings_confirmed_range_idx").on(
      table.confirmedStartAt,
      table.confirmedEndAt,
    ),
  ],
);

export const bookingHolds = sqliteTable(
  "booking_holds",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"requested" | "proposed" | "confirmed">().notNull(),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    overrideConflict: integer("override_conflict", { mode: "boolean" })
      .notNull()
      .default(false),
    releasedAt: integer("released_at"),
    releaseReason: text("release_reason"),
    createdAt: createdAt(),
  },
  (table) => [
    index("booking_holds_active_range_idx").on(
      table.active,
      table.startsAt,
      table.endsAt,
    ),
    index("booking_holds_booking_idx").on(table.bookingId, table.active),
  ],
);

export const bookingStatusHistory = sqliteTable(
  "booking_status_history",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").$type<BookingStatus>(),
    toStatus: text("to_status").$type<BookingStatus>().notNull(),
    actorType: text("actor_type").$type<ActorType>().notNull(),
    actorId: text("actor_id"),
    reason: text("reason"),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: createdAt(),
  },
  (table) => [
    index("booking_status_history_booking_idx").on(table.bookingId, table.createdAt),
  ],
);

export const styleProfiles = sqliteTable(
  "style_profiles",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    profileType: text("profile_type").$type<ProfileType>().notNull(),
    status: text("status").$type<ProfileStatus>().notNull().default("draft"),
    schemaVersion: integer("schema_version").notNull().default(1),
    answers: text("answers", { mode: "json" })
      .$type<JsonRecord>()
      .notNull()
      .default({}),
    currentSection: integer("current_section").notNull().default(1),
    inspirationLink: text("inspiration_link"),
    prefilledFromProfileId: text("prefilled_from_profile_id"),
    submittedAt: integer("submitted_at"),
    lockedAt: integer("locked_at"),
    reopenedAt: integer("reopened_at"),
    retentionDeleteAfter: integer("retention_delete_after"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("style_profiles_booking_unique").on(table.bookingId),
    index("style_profiles_client_type_idx").on(table.clientId, table.profileType),
    index("style_profiles_retention_delete_after_idx").on(table.retentionDeleteAfter),
  ],
);

export const styleProfileRevisions = sqliteTable(
  "style_profile_revisions",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => styleProfiles.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    action: text("action")
      .$type<"saved" | "submitted" | "admin_corrected" | "reopened">()
      .notNull(),
    actorType: text("actor_type").$type<ActorType>().notNull(),
    actorId: text("actor_id"),
    answersSnapshot: text("answers_snapshot", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    changedKeys: text("changed_keys", { mode: "json" }).$type<string[]>(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("style_profile_revisions_number_unique").on(
      table.profileId,
      table.revisionNumber,
    ),
  ],
);

export const privateAccessTokens = sqliteTable(
  "private_access_tokens",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => styleProfiles.id, {
      onDelete: "cascade",
    }),
    purpose: text("purpose")
      .$type<"style_profile" | "alternate_time" | "booking_summary">()
      .notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    usedAt: integer("used_at"),
    revokedAt: integer("revoked_at"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("private_access_tokens_hash_unique").on(table.tokenHash),
    index("private_access_tokens_lookup_idx").on(
      table.purpose,
      table.expiresAt,
      table.revokedAt,
    ),
  ],
);

export const inspirationAssets = sqliteTable(
  "inspiration_assets",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => styleProfiles.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedAt: createdAt(),
    deleteAfter: integer("delete_after"),
    deletedAt: integer("deleted_at"),
  },
  (table) => [
    uniqueIndex("inspiration_assets_profile_unique").on(table.profileId),
    uniqueIndex("inspiration_assets_r2_key_unique").on(table.r2Key),
    index("inspiration_assets_delete_after_idx").on(table.deleteAfter, table.deletedAt),
  ],
);

export const calendarConnections = sqliteTable("calendar_connections", {
  id: text("id").primaryKey(),
  provider: text("provider").$type<"microsoft_graph">().notNull(),
  accountId: text("account_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  displayName: text("display_name"),
  credentialSecretRef: text("credential_secret_ref").notNull(),
  permissionMode: text("permission_mode")
    .$type<"availability_only" | "manage_events">()
    .notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  subscriptionId: text("subscription_id"),
  subscriptionExpiresAt: integer("subscription_expires_at"),
  lastReconciledAt: integer("last_reconciled_at"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const calendarEvents = sqliteTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => calendarConnections.id, { onDelete: "restrict" }),
    providerEventId: text("provider_event_id").notNull(),
    providerEtag: text("provider_etag"),
    syncStatus: text("sync_status")
      .$type<"linked" | "pending" | "error" | "removed">()
      .notNull(),
    lastSyncedAt: integer("last_synced_at"),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("calendar_events_booking_unique").on(table.bookingId),
    uniqueIndex("calendar_events_provider_unique").on(
      table.connectionId,
      table.providerEventId,
    ),
  ],
);

export const communications = sqliteTable(
  "communications",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    channel: text("channel").$type<"email" | "sms" | "manual">().notNull(),
    templateKey: text("template_key").notNull(),
    recipient: text("recipient").notNull(),
    status: text("status")
      .$type<"queued" | "sent" | "failed" | "recorded">()
      .notNull(),
    providerMessageId: text("provider_message_id"),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    sentAt: integer("sent_at"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (table) => [index("communications_booking_idx").on(table.bookingId, table.createdAt)],
);

export const dataRequests = sqliteTable(
  "data_requests",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    kind: text("kind").$type<"access" | "correction" | "deletion">().notNull(),
    status: text("status")
      .$type<"open" | "in_progress" | "completed" | "declined">()
      .notNull()
      .default("open"),
    requestDetails: text("request_details"),
    resolutionNote: text("resolution_note"),
    requestedAt: createdAt(),
    completedAt: integer("completed_at"),
  },
  (table) => [index("data_requests_status_idx").on(table.status, table.requestedAt)],
);
