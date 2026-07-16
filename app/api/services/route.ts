import { dataResponse,withApi } from "@/lib/server/http";import{getD1}from"@/lib/server/runtime";
export async function GET(){return withApi(async id=>dataResponse({services:(await getD1().prepare(`SELECT code,audience,name,duration_minutes AS durationMinutes,routing_mode AS routingMode FROM services WHERE active=1 ORDER BY sort_order,name`).all()).results},200,id));}
