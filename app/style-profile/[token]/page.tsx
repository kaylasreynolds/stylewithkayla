import { StyleProfileClient } from "../page";

export const dynamic="force-dynamic";
export default async function PrivateStyleProfilePage({params}:{params:Promise<{token:string}>}){const{token}=await params;return <StyleProfileClient token={token}/>;}
