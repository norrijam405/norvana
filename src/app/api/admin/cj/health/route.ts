import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdminRead } from "@/lib/admin-guard";
import { getCjAccessToken } from "@/lib/cj/api";

/** Read-only authentication health check. Never returns or logs any CJ token. */
export async function GET(req:NextRequest){
 const gate=await requireCurrentRecoveryAdminRead(req);
 if(gate)return gate;
 if(!process.env.CJ_API_KEY?.trim())return NextResponse.json({state:"NEEDS_SETUP",message:"CJ API key is not configured for this deployment.",ordersEnabled:false},{headers:{"cache-control":"no-store"}});
 try{
  await getCjAccessToken();
  return NextResponse.json({state:"AUTHENTICATED",message:"CJ authentication succeeded. Product, pricing, inventory, freight and fulfillment still require separate checks.",ordersEnabled:false},{headers:{"cache-control":"no-store"}});
 }catch{
  return NextResponse.json({state:"AUTH_FAILED",message:"CJ authentication failed. Check account API status in CJ; don't purchase an order to unlock the account.",ordersEnabled:false},{headers:{"cache-control":"no-store"}});
 }
}
