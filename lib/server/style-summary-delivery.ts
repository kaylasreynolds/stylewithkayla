import { decryptPrivateToken, type EncryptedPrivateToken } from "./crypto";
import { ApiError } from "./http";
import { sendMicrosoftGraphMail } from "./microsoft-graph-mail";
import { renderStyleSummaryEmail } from "./style-summary-email";
import type { RecapSummaryContent } from "./recap-policy";

type CanonicalRow=EncryptedPrivateToken&{summaryId:string;content:string|RecapSummaryContent;sentAt:number|null;recipient:string|null;revokedAt:number|null;clientEmail:string;clientName:string;status:string};
export async function loadCanonicalStyleSummary(db:D1Database,bookingId:string,origin:string,key:string) {
  const row=await db.prepare(`SELECT r.status,s.id AS summaryId,s.content,s.sent_at AS sentAt,s.recipient,t.revoked_at AS revokedAt,t.token_ciphertext AS tokenCiphertext,t.token_iv AS tokenIv,t.token_auth_tag AS tokenAuthTag,c.email AS clientEmail,c.full_name AS clientName FROM appointment_recaps r JOIN clients c ON c.id=r.client_id LEFT JOIN recap_summaries s ON s.recap_id=r.id LEFT JOIN private_access_tokens t ON t.recap_summary_id=s.id AND t.purpose='recap_summary' WHERE r.booking_id=? ORDER BY s.version DESC LIMIT 1`).bind(bookingId).first<CanonicalRow>();
  if(!row)throw new ApiError(404,"RECAP_NOT_FOUND","This booking does not have an appointment recap yet.");
  if(row.status!=="published")throw new ApiError(409,"STYLE_SUMMARY_NOT_PUBLISHED","Publish the Style Summary before sending it.");
  if(!row.summaryId)throw new ApiError(409,"STYLE_SUMMARY_NOT_FOUND","The published Style Summary is unavailable.");
  if(row.revokedAt)throw new ApiError(410,"STYLE_SUMMARY_LINK_REVOKED","The canonical Style Summary link has been revoked.");
  const content=typeof row.content==="string"?JSON.parse(row.content) as RecapSummaryContent:row.content;
  if(!row.tokenCiphertext||!row.tokenIv||!row.tokenAuthTag)return {...row,content,styleSummaryUrl:null,linkRecoverable:false as const};
  let raw:string; try{raw=await decryptPrivateToken(row,key);}catch{throw new ApiError(409,"STYLE_SUMMARY_LINK_UNAVAILABLE","The canonical Style Summary link cannot be recovered.");}
  return {...row,content,styleSummaryUrl:`${origin}/style-summary/${raw}`,linkRecoverable:true as const};
}

type MailConfig={tenantId:string;clientId:string;clientSecret:string;mailbox:string;replyTo:string;notificationTo:string};
type DeliveryDependencies={key:string;config:MailConfig|null;now?:()=>number;id?:()=>string;send?:typeof sendMicrosoftGraphMail};
export async function deliverStyleSummaryEmail(db:D1Database,bookingId:string,origin:string,dependencies:DeliveryDependencies) {
  const canonical=await loadCanonicalStyleSummary(db,bookingId,origin,dependencies.key);
  if(!canonical.linkRecoverable)throw new ApiError(409,"STYLE_SUMMARY_LINK_UNAVAILABLE","The canonical Style Summary link cannot be recovered.");
  const recipient=canonical.clientEmail.trim();
  if(!recipient||!/^\S+@\S+\.\S+$/.test(recipient))throw new ApiError(409,"CLIENT_EMAIL_UNAVAILABLE","No client email address is available.");
  const id=(dependencies.id??(()=>crypto.randomUUID()))(),now=(dependencies.now??Date.now)();
  await db.prepare(`INSERT INTO communications(id,booking_id,channel,template_key,recipient,status,metadata,created_at) VALUES(?,?,'email','style_summary_follow_up',?,'queued',?,?)`).bind(id,bookingId,recipient,JSON.stringify({deliveryDeferred:false}),now).run();
  const config=dependencies.config;
  if(!config){await db.prepare(`UPDATE communications SET status='failed',error_message=? WHERE id=?`).bind("Microsoft appointment email is not configured.",id).run();throw new ApiError(502,"STYLE_SUMMARY_EMAIL_FAILED","The Style Summary is published, but the email could not be sent. Please try again.");}
  const message=renderStyleSummaryEmail({firstName:canonical.clientName.trim().split(/\s+/)[0]||"there",styleSummaryUrl:canonical.styleSummaryUrl});
  try{await (dependencies.send??sendMicrosoftGraphMail)(config,{to:recipient,subject:message.subject,html:message.html});}
  catch(error){const detail=error instanceof Error?error.message:String(error);await db.prepare(`UPDATE communications SET status='failed',error_message=? WHERE id=?`).bind(detail.slice(0,1000),id).run();console.error("Style Summary email failed",{bookingId,recipient,error:detail});throw new ApiError(502,"STYLE_SUMMARY_EMAIL_FAILED","The Style Summary is published, but the email could not be sent. Please try again.");}
  const sentAt=(dependencies.now??Date.now)();
  await db.batch([db.prepare(`UPDATE communications SET status='sent',sent_at=?,error_message=NULL WHERE id=?`).bind(sentAt,id),db.prepare(`UPDATE recap_summaries SET sent_at=?,recipient=? WHERE id=?`).bind(sentAt,recipient,canonical.summaryId)]);
  return {sent:true as const,recipient,sentAt:new Date(sentAt).toISOString()};
}
