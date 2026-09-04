export type PublicRegistrationEvent = {
  attendanceType?: unknown;
  unlimitedCapacity?: unknown;
  spotsRemaining?: unknown;
  registrationOpensAt?: unknown;
  registrationClosesAt?: unknown;
  timezone?: unknown;
};

const REGISTERABLE_ATTENDANCE =
  new Set([
    "appointment_required",
    "appointment_recommended",
    "general_rsvp",
    "interest_list",
  ]);

export function isRegisterableEvent(
  event: PublicRegistrationEvent,
) {
  return REGISTERABLE_ATTENDANCE.has(
    String(
      event.attendanceType ?? "",
    ),
  );
}

export type RegistrationAvailability =
  | {
      kind: "available";
      disabled: false;
      message: string;
    }
  | {
      kind:
        | "full"
        | "closed"
        | "not_open";
      disabled: true;
      message: string;
    };

export function registrationAvailability(
  event: PublicRegistrationEvent,
  now: number,
): RegistrationAvailability {
  const unlimited = Boolean(
    event.unlimitedCapacity,
  );

  const remaining = Number(
    event.spotsRemaining,
  );

  const closesAt =
    event.registrationClosesAt
      ? new Date(
          String(
            event.registrationClosesAt,
          ),
        ).getTime()
      : null;

  const opensAt =
    event.registrationOpensAt
      ? new Date(
          String(
            event.registrationOpensAt,
          ),
        ).getTime()
      : null;

  /*
   * Registration-window state takes
   * precedence over capacity so the
   * customer sees the most relevant
   * reason registration is unavailable.
   */
  if (
    closesAt !== null &&
    closesAt <= now
  ) {
    return {
      kind: "closed",
      disabled: true,
      message:
        "Registration Closed",
    };
  }

  if (
    opensAt !== null &&
    opensAt > now
  ) {
    const formatted =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: String(
            event.timezone ||
              "America/Boise",
          ),
        },
      ).format(
        new Date(opensAt),
      );

    return {
      kind: "not_open",
      disabled: true,
      message: `Registration opens ${formatted}`,
    };
  }

  if (
    !unlimited &&
    Number.isFinite(remaining) &&
    remaining < 1
  ) {
    return {
      kind: "full",
      disabled: true,
      message: "Event Full",
    };
  }

  const message =
    !unlimited &&
    Number.isFinite(remaining) &&
    remaining <= 5
      ? `${remaining} spot${
          remaining === 1
            ? ""
            : "s"
        } remaining`
      : "";

  return {
    kind: "available",
    disabled: false,
    message,
  };
}