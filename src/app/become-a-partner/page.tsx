"use client";

import { FormEvent, useState } from "react";

export default function ApplyForm() {
  const [state, setState] = useState<"idle" | "working" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "working") return;
    setState("working");
    const data = new FormData(event.currentTarget);
    const fields = Object.fromEntries(data.entries());
    const payload = { ...fields, productCategories: [String(fields.category || "")].filter(Boolean), capacityNotes: String(fields.products || "").slice(0,1500), fulfillmentModes: [String(fields.fulfillment || "")].filter(Boolean), leadTimeNotes: fields.leadTime, painPoint: fields.partnershipFit, pilotInterest: "DISCUSS" };
    try {
      const response = await fetch("/api/producer-interest", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Submission unavailable.");
      setMessage("Thank you. Your application has been received for review. This does not create a supplier agreement.");
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit. Please retry later.");
      setState("error");
    }
  }
  const field = "mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900";
  return <main className="min-h-screen bg-[#f8f5ec] px-4 py-14 text-stone-900">
    <div className="mx-auto max-w-3xl">
      <a href="/" className="text-sm font-semibold underline">← Acre Era</a>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-amber-800">Become a producer partner</p>
      <h1 className="mt-3 text-4xl font-bold">Let's learn about your business.</h1>
      <p className="mt-4 leading-7 text-stone-600">Farms, ranchers, butchers, food hubs, makers and independent shops are welcome to introduce themselves. We're building a carefully qualified marketplace across the United States. Submitting this form doesn't guarantee acceptance or product placement.</p>
      {state === "success" ? <div role="status" className="mt-8 rounded-2xl border border-green-600 bg-green-50 p-6">{message}</div> :
      <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">Business name *<input required name="businessName" maxLength={255} className={field}/></label>
          <label className="text-sm font-medium">Your name *<input required name="contactName" maxLength={255} className={field}/></label>
          <label className="text-sm font-medium">Business email *<input required type="email" name="email" maxLength={320} className={field}/></label>
          <label className="text-sm font-medium">Phone (optional)<input name="phone" maxLength={80} className={field}/></label>
          <label className="text-sm font-medium">City and state *<input required name="location" maxLength={255} placeholder="Tulsa, Oklahoma" className={field}/></label>
          <label className="text-sm font-medium">Website (optional)<input name="website" type="url" maxLength={1000} placeholder="https://" className={field}/></label>
          <label className="text-sm font-medium">Business type<select name="category" className={field}><option value="FARM">Farm / grower</option><option value="RANCH">Ranch / livestock</option><option value="BUTCHER">Butcher / meat processor</option><option value="FOOD_HUB">Food hub / distributor</option><option value="SPECIALTY">Bakery / honey / specialty food</option><option value="MAKER">Maker / independent store</option></select></label>
          <label className="text-sm font-medium">Sell direct, wholesale, or both?<select name="salesModel" className={field}><option value="BOTH">Both</option><option value="RETAIL">Retail</option><option value="WHOLESALE">Wholesale</option><option value="UNKNOWN">Let's discuss</option></select></label>
        </div>
        <label className="block text-sm font-medium">What products do you offer? *<textarea required name="products" rows={3} maxLength={1500} className={field}/></label>
        <label className="block text-sm font-medium">What's seasonal or changes during the year?<textarea name="seasonality" rows={2} maxLength={2000} className={field}/></label>
        <label className="block text-sm font-medium">How do you fulfill orders? (pickup, local delivery, shipping)<textarea name="fulfillment" rows={2} maxLength={2000} className={field}/></label>
        <label className="block text-sm font-medium">Typical order preparation time or minimums<textarea name="leadTime" rows={2} maxLength={2000} className={field}/></label>
        <label className="block text-sm font-medium">What would make a partnership useful to you?<textarea name="partnershipFit" rows={2} maxLength={2000} className={field}/></label>
        <label className="block text-sm font-medium">Photo / video permission<select name="mediaInterest" className={field}><option value="DISCUSS">Discuss first</option><option value="YES">Open to discussing permission</option><option value="NO">Not currently</option></select></label>
        <div className="hidden" aria-hidden="true"><label>Leave blank<input name="homepage" tabIndex={-1} autoComplete="off"/></label></div>
        <p className="text-xs leading-5 text-stone-500">We'll use this information to review your interest and contact you about a potential partnership. Do not submit private financial or sensitive documents. Photos and videos are requested later through an approved process. No product is published automatically.</p>
        <button disabled={state === "working"} className="rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white disabled:opacity-50">{state === "working" ? "Submitting…" : "Submit for review"}</button>
        {state === "error" ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
      </form>}
    </div>
  </main>;
}
