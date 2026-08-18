export function sanitizeBookingNotes(notes: string | null | undefined, phone: string) {
  const value = notes?.trim();
  if (!value) return null;

  const noteDigits = value.replace(/\D/g, "");
  const phoneDigits = phone.replace(/\D/g, "");
  const containsOnlyPhoneCharacters = value.replace(/[\d()+.\-\s]/g, "") === "";

  if (containsOnlyPhoneCharacters && noteDigits.length >= 7 && noteDigits === phoneDigits) return null;
  return value;
}
