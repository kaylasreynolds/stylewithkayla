import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  registrationAvailability,
} from "../lib/event-rsvp-state";

const now = Date.parse(
  "2026-09-04T18:00:00Z",
);

const base = {
  attendanceType: "general_rsvp",
  unlimitedCapacity: false,
  spotsRemaining: 10,
  timezone: "America/Boise",
};

test(
  "full, closed, and future registration windows disable standalone registration",
  () => {
    assert.deepEqual(
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 0,
        },
        now,
      ),
      {
        kind: "full",
        disabled: true,
        message: "Event Full",
      },
    );

    assert.deepEqual(
      registrationAvailability(
        {
          ...base,
          registrationClosesAt:
            "2026-09-04T17:59:00Z",
        },
        now,
      ),
      {
        kind: "closed",
        disabled: true,
        message:
          "Registration Closed",
      },
    );

    const future =
      registrationAvailability(
        {
          ...base,
          registrationOpensAt:
            "2026-09-05T18:00:00Z",
        },
        now,
      );

    assert.equal(
      future.kind,
      "not_open",
    );

    assert.equal(
      future.disabled,
      true,
    );

    assert.match(
      future.message,
      /^Registration opens /,
    );
  },
);

test(
  "registration windows take precedence over capacity",
  () => {
    assert.deepEqual(
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 0,
          registrationClosesAt:
            "2026-09-04T17:59:00Z",
        },
        now,
      ),
      {
        kind: "closed",
        disabled: true,
        message:
          "Registration Closed",
      },
    );

    const future =
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 0,
          registrationOpensAt:
            "2026-09-05T18:00:00Z",
        },
        now,
      );

    assert.equal(
      future.kind,
      "not_open",
    );

    assert.equal(
      future.disabled,
      true,
    );

    assert.match(
      future.message,
      /^Registration opens /,
    );
  },
);

test(
  "limited availability uses the existing five-spot threshold",
  () => {
    assert.equal(
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 1,
        },
        now,
      ).message,
      "1 spot remaining",
    );

    assert.equal(
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 5,
        },
        now,
      ).message,
      "5 spots remaining",
    );

    assert.equal(
      registrationAvailability(
        {
          ...base,
          spotsRemaining: 6,
        },
        now,
      ).message,
      "",
    );

    assert.equal(
      registrationAvailability(
        {
          ...base,
          unlimitedCapacity: true,
          spotsRemaining: 1,
        },
        now,
      ).message,
      "",
    );
  },
);

test(
  "standalone appointment and success states preserve RSVP parity",
  async () => {
    const source = await readFile(
      new URL(
        "../app/events/[slug]/EventPageActions.tsx",
        import.meta.url,
      ),
      "utf8",
    );

    assert.match(
      source,
      /requiredSlotsUnavailable\s*=\s*appointmentRequired\s*&&\s*slots\.length\s*===\s*0/,
    );

    assert.match(
      source,
      /No appointment\s+times are currently\s+available\./,
    );

    assert.match(
      source,
      /disabled=\{\s*submitting\s*\|\|\s*requiredSlotsUnavailable\s*\}/,
    );

    assert.match(
      source,
      /appointmentRecommended\s*&&\s*slots\.length\s*===\s*0/,
    );

    assert.match(
      source,
      /You can\s+still RSVP without\s+one\./,
    );

    assert.match(
      source,
      /setPartySize\(\s*Number\(/,
    );

    assert.match(
      source,
      /You’re registered!/,
    );

    assert.match(
      source,
      /onClose=\{resetRegistration\}/,
    );

    assert.match(
      source,
      /form\.current\?\.reset\(\)/,
    );

    assert.match(
      source,
      /setPartySize\(null\)/,
    );

    assert.match(
      source,
      /if \(availability\.disabled\) return/,
    );

    assert.match(
      source,
      /disabled=\{\s*availability\.disabled\s*\}/,
    );

    assert.match(
      source,
      /"idempotency-key":\s*crypto\.randomUUID\(\)/,
    );
  },
);