import { ApiError, validation } from "./http";
export type AvailabilityRuleInput={weekday:number;startMinute:number;endMinute:number};
export function validateAvailabilityRules(value:unknown):AvailabilityRuleInput[]{
  if(!Array.isArray(value)||value.length>20)throw validation("rules","Provide no more than 20 routine windows.");
  const rules=value.map((item,index)=>{if(!item||typeof item!=="object"||Array.isArray(item))throw validation(`rules.${index}`,"Each rule must be an object.");const row=item as Record<string,unknown>;for(const key of Object.keys(row))if(!new Set(["weekday","startMinute","endMinute"]).has(key))throw new ApiError(400,"UNEXPECTED_FIELD",`rules.${index} contains an unexpected field: ${key}.`);const weekday=Number(row.weekday),startMinute=Number(row.startMinute),endMinute=Number(row.endMinute);if(!Number.isInteger(weekday)||weekday<2||weekday>6)throw validation(`rules.${index}.weekday`,"Routine availability is limited to Tuesday through Saturday.");if(!Number.isInteger(startMinute)||!Number.isInteger(endMinute)||startMinute<0||endMinute>1440||startMinute>=endMinute)throw validation(`rules.${index}`,"Choose a valid start and end time.");return{weekday,startMinute,endMinute};});
  for(const weekday of [2,3,4,5,6]){const day=rules.filter(rule=>rule.weekday===weekday).sort((a,b)=>a.startMinute-b.startMinute);for(let index=1;index<day.length;index++)if(day[index].startMinute<day[index-1].endMinute)throw validation("rules","Routine windows cannot overlap.");}
  return rules;
}
