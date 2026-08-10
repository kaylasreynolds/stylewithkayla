import { RsvpDetailManager } from "../../../RsvpManager";

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string; rsvpId: string }>;
}) {
  const values = await params;
  return <RsvpDetailManager {...values} />;
}
