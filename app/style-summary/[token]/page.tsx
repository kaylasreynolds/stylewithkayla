import { StyleSummaryClient } from "../page";
export default async function Page({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <StyleSummaryClient token={token} />; }
