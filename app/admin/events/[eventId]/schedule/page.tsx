import{Schedule}from"../../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string}>}){return <Schedule eventId={(await params).eventId}/>}
