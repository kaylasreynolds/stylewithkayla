export function manageAppointmentPath(token: string) {
  return `/appointments/manage/${encodeURIComponent(token)}`;
}

export function manageAppointmentUrl(requestUrl: string, token: string) {
  return new URL(manageAppointmentPath(token), requestUrl).toString();
}
