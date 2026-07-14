import { ApiError, validation } from "./http";

export const STYLE_PROFILE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PROFILE_SCHEMA_VERSION = 1;
export const PROFILE_TYPES = new Set(["under_40","over_40","womens_event","mens_styling","mens_event"]);
const allowedKeys = new Set(["shoppingFor","goals","styles","inspirationLink","bodyShape","fitAreas","otherFit","sizingDepartment","comfortPreference","sizes","topFit","pantCuts","bestStyles","avoidStyles","finalNotes"]);

export function validateProfileDraft(value: unknown, submit = false) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw validation("answers","Profile answers must be an object.");
  const answers=value as Record<string,unknown>, encoded=JSON.stringify(answers);
  if(encoded.length>32000)throw new ApiError(413,"PROFILE_TOO_LARGE","The Style Profile is too large.");
  for(const key of Object.keys(answers))if(!allowedKeys.has(key))throw validation(`answers.${key}`,"This profile field is not recognized.");
  limitedStrings(answers.shoppingFor,"answers.shoppingFor",3);limitedStrings(answers.styles,"answers.styles",3);limitedStrings(answers.fitAreas,"answers.fitAreas",6);limitedStrings(answers.pantCuts,"answers.pantCuts",6);
  for(const key of ["goals","inspirationLink","bodyShape","otherFit","sizingDepartment","comfortPreference","topFit","bestStyles","avoidStyles","finalNotes"]) optionalText(answers[key],`answers.${key}`,2000);
  if(answers.sizes!==undefined){if(!answers.sizes||typeof answers.sizes!=="object"||Array.isArray(answers.sizes))throw validation("answers.sizes","Sizes must be an object.");for(const [key,val] of Object.entries(answers.sizes as Record<string,unknown>)){if(!new Set(["top","pant","dress","shoe","bra"]).has(key))throw validation(`answers.sizes.${key}`,"This size field is not recognized.");optionalText(val,`answers.sizes.${key}`,80);}}
  if(submit){if(!Array.isArray(answers.shoppingFor)||!answers.shoppingFor.length)throw validation("answers.shoppingFor","Choose at least one styling goal.");if(!Array.isArray(answers.styles)||!answers.styles.length)throw validation("answers.styles","Choose at least one style.");if(typeof answers.bodyShape!=="string"||!answers.bodyShape.trim())throw validation("answers.bodyShape","Choose the closest body-shape option.");const sizes=(answers.sizes??{}) as Record<string,unknown>;for(const key of ["top","pant","dress","shoe"])if(typeof sizes[key]!=="string"||!sizes[key].trim())throw validation(`answers.sizes.${key}`,"Enter a starting size.");}
  return answers;
}
function limitedStrings(value:unknown,field:string,max:number){if(value===undefined)return;if(!Array.isArray(value)||value.length>max||value.some(item=>typeof item!=="string"||!item.trim()||item.length>100))throw validation(field,`Choose up to ${max} valid options.`);}
function optionalText(value:unknown,field:string,max:number){if(value!==undefined&&value!==null&&(typeof value!=="string"||value.length>max))throw validation(field,"This value is invalid or too long.");}
