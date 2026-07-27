import{EventOverview}from"../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string}>}){return <EventOverview eventId={(await params).eventId}/>}
