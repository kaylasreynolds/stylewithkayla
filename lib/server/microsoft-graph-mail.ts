export type MicrosoftGraphMailConfig = { tenantId:string; clientId:string; clientSecret:string; mailbox:string; replyTo:string };
export type MicrosoftGraphMessage = { to:string; subject:string; html:string; calendar?:string };

async function accessToken(config:MicrosoftGraphMailConfig) {
  const response=await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,scope:"https://graph.microsoft.com/.default",grant_type:"client_credentials"})});
  const payload=await response.json() as {access_token?:string;error_description?:string;error?:string};
  if(!response.ok||!payload.access_token)throw new Error(`Microsoft authentication failed (${response.status}): ${payload.error_description||payload.error||"No access token returned."}`);
  return payload.access_token;
}
const base64=(value:string)=>{const bytes=new TextEncoder().encode(value);let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);};

export async function sendMicrosoftGraphMail(config:MicrosoftGraphMailConfig,message:MicrosoftGraphMessage) {
  const token=await accessToken(config);
  const response=await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({message:{subject:message.subject,body:{contentType:"HTML",content:message.html},toRecipients:[{emailAddress:{address:message.to}}],replyTo:[{emailAddress:{address:config.replyTo}}],attachments:message.calendar?[{"@odata.type":"#microsoft.graph.fileAttachment",name:"style-with-kayla-appointment.ics",contentType:"text/calendar; method=REQUEST; charset=UTF-8",contentBytes:base64(message.calendar)}]:[]},saveToSentItems:true})});
  if(!response.ok)throw new Error(`Microsoft email failed (${response.status}): ${(await response.text()).slice(0,700)}`);
}
