import { RsvpManager } from "../../RsvpManager";

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <RsvpManager eventId={(await params).eventId} />;
}
