import ManageAppointment from "../ManageAppointment";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{token:string}>}){return <ManageAppointment token={(await params).token}/>;}
