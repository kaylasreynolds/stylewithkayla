import{RsvpTable}from"../../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string}>}){return <RsvpTable eventId={(await params).eventId}/>}
