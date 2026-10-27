import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { featuredProducerProposals } from "@/db/schema";
import { requireCurrentRecoveryAdmin, requireCurrentRecoveryAdminRead } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";

const categories=["FARM","RANCH","FOOD_MAKER","ARTISAN","LOCAL_SHOP","WINERY_DISCOVERY","BREWERY_DISCOVERY"];
const clean=(x:unknown,n:number)=>typeof x==="string"?x.trim().slice(0,n):"";
export async function GET(req:NextRequest){
 const gate=await requireCurrentRecoveryAdminRead(req);if(gate)return gate;
 try{return NextResponse.json({proposals:await db.select().from(featuredProducerProposals).orderBy(desc(featuredProducerProposals.id)).limit(100),publicListingsCreated:false},{headers:{"cache-control":"no-store"}});}
 catch{return NextResponse.json({error:"Private proposal storage unavailable."},{status:503});}
}
export async function POST(req:NextRequest){
 const gate=await requireCurrentRecoveryAdmin(req);if(gate)return gate;
 const parsed=await readJsonObjectLimited(req,8_000);if(!parsed.ok)return NextResponse.json({error:parsed.error},{status:parsed.status});
 const name=clean(parsed.body.businessName,160),region=clean(parsed.body.region,160),category=clean(parsed.body.category,40),story=clean(parsed.body.story,1000),contact=clean(parsed.body.contactEmail,320);
 const rights=clean(parsed.body.mediaRights,40);
 const sponsorship=clean(parsed.body.sponsorship,40);
 if(name.length<2||region.length<2||!categories.includes(category)||!["UNVERIFIED","REQUESTED","DOCUMENTED_REVIEW"].includes(rights)||!["EDITORIAL_UNPAID","SPONSORED_PROPOSAL"].includes(sponsorship))return NextResponse.json({error:"Invalid proposal details."},{status:400});
 if((category==="WINERY_DISCOVERY"||category==="BREWERY_DISCOVERY")&&sponsorship!=="EDITORIAL_UNPAID")return NextResponse.json({error:"Alcohol producer sponsorships are not enabled."},{status:403});
 if(contact&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))return NextResponse.json({error:"Invalid contact email."},{status:400});
 try{const [created]=await db.insert(featuredProducerProposals).values({businessName:name,region,category,story,contactEmail:contact||null,mediaRights:rights,sponsorship,status:"DRAFT"}).returning({id:featuredProducerProposals.id});return NextResponse.json({id:created.id,status:"DRAFT",published:false,charged:false},{status:201});}
 catch{return NextResponse.json({error:"Could not save proposal."},{status:503});}
}
