import{RsvpDetail}from"../../../EventConsole";export default async function Page({params}:{params:Promise<{eventId:string;rsvpId:string}>}){const p=await params;return <RsvpDetail {...p}/>}
