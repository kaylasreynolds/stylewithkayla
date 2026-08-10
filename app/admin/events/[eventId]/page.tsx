import EventOverviewPanel from "../EventOverviewPanel";

export default async function Page({params}:{params:Promise<{eventId:string}>}){
  return <EventOverviewPanel eventId={(await params).eventId}/>;
}
