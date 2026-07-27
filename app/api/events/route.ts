import { dataResponse, withApi } from "@/lib/server/http";
import { publicEventJson } from "@/lib/server/event-management";
import { getD1 } from "@/lib/server/runtime";
export async function GET(){return withApi(async id=>{const rows=(await getD1().prepare("SELECT id,title,description,location,starts_at startsAt,ends_at endsAt,timezone,image_asset_id imageAssetId,image_mime_type imageMimeType,image_width imageWidth,image_height imageHeight,image_alt imageAlt FROM events WHERE status='published' AND ends_at>=? ORDER BY starts_at LIMIT 100").bind(Date.now()).all<Record<string,unknown>>()).results;return dataResponse({events:rows.map(publicEventJson)},200,id)})}
