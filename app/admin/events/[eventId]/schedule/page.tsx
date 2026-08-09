import { ScheduleManager } from "../../ScheduleManager";

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <ScheduleManager eventId={(await params).eventId} />;
}
