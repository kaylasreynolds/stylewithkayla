import{CheckIn}from"../../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string}>}){return <CheckIn eventId={(await params).eventId}/>}
