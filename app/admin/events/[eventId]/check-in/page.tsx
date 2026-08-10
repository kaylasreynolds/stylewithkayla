import CheckInManager from "../../CheckInManager";

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <CheckInManager eventId={(await params).eventId} />;
}
