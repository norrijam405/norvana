import { NextRequest,NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { loadCjProductBySku,quoteCjVariantToUs,parseAging } from "@/lib/cj/api";
export async function POST(req:NextRequest){
 const gate=await requireCurrentRecoveryAdmin(req);if(gate)return gate;
 let sku="";try{sku=String((await req.json()).sku||"").trim();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 if(!/^[\w. -]{5,100}$/.test(sku))return NextResponse.json({error:"Invalid product SKU."},{status:400});
 try {
  const found=await loadCjProductBySku(sku);
  const exact=found.variants.find(v=>v.variantSku===sku);
  if(!exact)return NextResponse.json({state:"HOLD",reason:"No exact matching variant SKU. Choose a variant manually before qualification.",sku,variantOptions:found.variants.slice(0,12).map(v=>({vid:v.vid,name:v.variantNameEn||v.variantSku||v.vid}))});
  const route=await quoteCjVariantToUs(exact.vid);
  const stock=route.inventory.reduce((sum,x)=>sum+Math.max(0,Number(x.totalInventoryNum||0)),0);
  const shipping=route.methods[0];
  const cost=Number(exact.variantSellPrice);
  const freight=Number(shipping?.logisticPrice);
  const aging=parseAging(shipping?.logisticAging);
  const validPrice=exact.variantSellPrice!==null&&exact.variantSellPrice!==undefined&&Number.isFinite(cost)&&cost>0;
  const validFreight=!!shipping&&Number.isFinite(freight)&&freight>=0;
  const landed=validPrice&&validFreight?cost+freight:null;
  const state=stock>0&&landed!==null&&aging.max!==null&&aging.max<=21?"NEEDS_PROCESSING_AND_APPROVAL":"HOLD";
  return NextResponse.json({sku,variant:{id:exact.vid,name:exact.variantNameEn||exact.variantSku||exact.vid},state,stock,productCost:validPrice?cost:null,shippingCost:validFreight?freight:null,baseLandedCost:landed,transitDays:aging,carrier:shipping?.logisticName||null,origin:route.originCountryCode,priceExamples:landed===null?[]:[9.99,12.99,14.99,19.99].map(price=>({price,grossBeforeFees:Number((price-landed).toFixed(2))})),reason:state==="HOLD"?"Stock, price, freight, or delivery quote is incomplete.":"Stock and freight available; processing, fees, returns, product rights, and safety still require review.",approved:false,published:false,ordered:false},{headers:{"cache-control":"no-store"}});
 }catch{return NextResponse.json({state:"HOLD",error:"CJ qualification could not complete. Try the manual route check; do not assume this item is sellable."},{status:502});}
}
