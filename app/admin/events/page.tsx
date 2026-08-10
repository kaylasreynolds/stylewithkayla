import Link from "next/link";
import { requireAccessUser } from "../../cloudflare-access";
import { EventList } from "./EventConsole";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAccessUser();

  return (
    <>
      <div
        style={{
          width: "min(1120px, calc(100% - 40px))",
          margin: "24px auto -8px",
        }}
      >
        <Link
          className="event-button event-button--secondary"
          href="/admin"
        >
          ← Back to Admin
        </Link>
      </div>
      <EventList />
    </>
  );
}
