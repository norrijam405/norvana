import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { producerInterestSubmissions, producerConversationNotes } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";

const STATES = ["NEW","REVIEWING","NEEDS_INFO","QUALIFIED","DECLINED","PAUSED"] as const;
type State = typeof STATES[number];
const TRANSITIONS: Record<State,readonly State[]> = {
  NEW:["REVIEWING","NEEDS_INFO","DECLINED","PAUSED"],
  REVIEWING:["NEEDS_INFO","QUALIFIED","DECLINED","PAUSED"],
  NEEDS_INFO:["REVIEWING","DECLINED","PAUSED"],
  QUALIFIED:["REVIEWING","PAUSED"],
  DECLINED:["REVIEWING"],
  PAUSED:["REVIEWING","DECLINED"]
};
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const gate=await requireCurrentRecoveryAdmin(req);if(gate)return gate;
  const {id}=await params;
  if(!/^\d{1,10}$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<1)return NextResponse.json({error:"Invalid application id"},{status:400});
  const parsed=await readJsonObjectLimited(req,8000);if(!parsed.ok)return NextResponse.json({error:parsed.error},{status:parsed.status});
  const target=parsed.body.status;
  const note=typeof parsed.body.note==="string"?parsed.body.note.trim().slice(0,2000):"";
  if(typeof target!=="string"||!STATES.includes(target as State))return NextResponse.json({error:"Invalid review status"},{status:400});
  if(!note || note.length<3)return NextResponse.json({error:"Add a review note or next step (3 characters minimum)"},{status:400});
  try {
    const result=await db.transaction(async tx=>{
      const [application]=await tx.select().from(producerInterestSubmissions).where(eq(producerInterestSubmissions.id,Number(id))).for("update").limit(1);
      if(!application)return {code:404,error:"Application not found"};
      const [latestReview]=await tx.select().from(producerConversationNotes).where(eq(producerConversationNotes.interestSubmissionId,Number(id))).orderBy(desc(producerConversationNotes.createdAt),desc(producerConversationNotes.id)).limit(1);
      const from=(latestReview?.conversationStage==="APPLICATION_REVIEW" && typeof latestReview.answers.toStatus==="string" ? latestReview.answers.toStatus : application.status) as State;
      if(!STATES.includes(from)||!TRANSITIONS[from].includes(target as State))return {code:409,error:"Invalid transition from "+from+" to "+target};
      await tx.insert(producerConversationNotes).values({
        interestSubmissionId:Number(id), businessName:application.businessName, contactName:application.contactName,
        contactMethod:"INTERNAL",conversationStage:"APPLICATION_REVIEW",
        answers:{fromStatus:from,toStatus:target},operatorSummary:note,nextStep:note,
        pilotRecommendation:"UNDECIDED",evidenceRefs:[],actor:"owner"
      });
      return {code:200,id:application.id,status:target,previousStatus:from,recorded:true,appendOnly:true};
    });
    if("error" in result)return NextResponse.json({error:result.error},{status:result.code});
    return NextResponse.json(result,{headers:{"cache-control":"no-store"}});
  }catch(e){console.error("Producer review state update failed",e);return NextResponse.json({error:"Review update unavailable; no success confirmed"},{status:503});}
}
