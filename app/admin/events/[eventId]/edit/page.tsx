import{EventEditor}from"../../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string}>}){return <EventEditor eventId={(await params).eventId}/>}
