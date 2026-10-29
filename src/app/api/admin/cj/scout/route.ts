import { NextRequest,NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { searchCjCatalog } from "@/lib/cj/api";

const TERMS=["kitchen organizer","pet grooming","reusable shopping bag"] as const;
const prohibited=/\b(vape|cbd|thc|alcohol|beer|wine|knife|weapon|medicine|supplement|tobacco|adult)\b/i;
export async function POST(req:NextRequest){
 const gate=await requireCurrentRecoveryAdmin(req);if(gate)return gate;
 const results:Array<{sku:string;name:string;sourcePrice:number;verifiedUnits:number;processingDays:string|null;keyword:string;state:"NEEDS_ROUTE_CHECK"}>=[];
 const errors:string[]=[];
 for(const keyword of TERMS){
  try{
   const hits=await searchCjCatalog(keyword);
   for(const item of hits){
    const sku=item.sku?.trim(),name=item.nameEn?.trim(),price=Number(item.nowPrice||item.sellPrice);
    if(!sku||!name||prohibited.test(name)||!Number.isFinite(price)||price<=0||price>20)continue;
    if(results.some(x=>x.sku===sku))continue;
    results.push({sku,name:name.slice(0,180),sourcePrice:price,verifiedUnits:Number(item.totalVerifiedInventory||0),processingDays:item.deliveryCycle||null,keyword,state:"NEEDS_ROUTE_CHECK"});
   }
  }catch{errors.push(keyword+": CJ search failed or access limited");}
 }
 results.sort((a,b)=>b.verifiedUnits-a.verifiedUnits||a.sourcePrice-b.sourcePrice);
 return NextResponse.json({candidates:results.slice(0,12),searched:[...TERMS],errors,disclaimer:"Discovery only. Search listings may lack verified inventory fields; a zero means no verified quantity reported, NOT out of stock. Price is not landed cost. Variants, real-time inventory, processing, freight, fees, rights, safety and supplier authorization remain unverified. Nothing imported, published or ordered."},{headers:{"cache-control":"no-store"}});
}
