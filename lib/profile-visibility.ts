export type ProfileVisibilityQuestion={returningOnly?:boolean;showUnless?:{key:string;value:string};showWhen?:{key:string;values:string[]}};
export type ProfileVisibilitySection={showWhen?:{key:string;values:string[]}};
export function isQuestionVisible(question:ProfileVisibilityQuestion,answers:Record<string,unknown>,returningClient=false){
 if(question.returningOnly&&!returningClient)return false;
 if(question.showUnless&&answers[question.showUnless.key]===question.showUnless.value)return false;
 if(question.showWhen&&!question.showWhen.values.includes(String(answers[question.showWhen.key]??"")))return false;
 return true;
}
export function isSectionVisible(section:ProfileVisibilitySection,answers:Record<string,unknown>){
 if(section.showWhen&&!section.showWhen.values.includes(String(answers[section.showWhen.key]??"")))return false;
 return true;
}
