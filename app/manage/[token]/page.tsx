import { manageAppointmentPath } from "@/lib/appointment/manage-path";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  redirect(manageAppointmentPath((await params).token));
}
