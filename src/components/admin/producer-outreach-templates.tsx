"use client";

import { useMemo, useState } from "react";

const TEMPLATES = [
  { id: "farm", label: "Farms & produce", subject: "Acre Era × [Business] — local farm partnership", body: "Hello [Contact],\n\nI'm reaching out from Acre Era, an emerging marketplace building a curated network of local farms and independent producers across [Region] and surrounding communities.\n\nI'd love to learn more about [Business], including seasonal products, availability, pricing, and pickup or delivery options.\n\nWould you be open to a brief introductory conversation?\n\nBest regards,\nAcre Era Partnerships\ncontact@acreera.com" },
  { id: "butcher", label: "Butchers & ranchers", subject: "Acre Era × [Business] — meat supplier inquiry", body: "Hello [Contact],\n\nI'm reaching out from Acre Era, a developing marketplace exploring relationships with [Region] butchers, ranchers, and meat suppliers.\n\nWould [Business] be open to discussing product availability, retail or wholesale terms, pickup, and temperature-controlled fulfillment? We're assessing whether a small pilot could be practical for both sides.\n\nThank you,\nAcre Era Partnerships\ncontact@acreera.com" },
  { id: "specialty", label: "Bakeries, honey & specialty food", subject: "Exploring a local partnership with [Business]", body: "Hello [Contact],\n\nAcre Era is building a carefully selected marketplace for independent businesses and local goods. We would love to learn whether [Business] has products suitable for a small marketplace pilot.\n\nCould we discuss your catalog, packaging, availability, pricing, and order fulfillment?\n\nBest regards,\nAcre Era Partnerships\ncontact@acreera.com" },
  { id: "maker", label: "Local shops & makers", subject: "Acre Era × [Business] — possible marketplace partnership", body: "Hello [Contact],\n\nI'm with Acre Era, a developing marketplace helping shoppers discover independent businesses. We're exploring a small group of [Region] partners and would love to learn about [Business].\n\nWould you be open to discussing your product catalog, current sales channels, and fulfillment options?\n\nBest regards,\nAcre Era Partnerships\ncontact@acreera.com" },
  { id: "hub", label: "Food hubs & wholesalers", subject: "Acre Era — producer-network collaboration inquiry", body: "Hello [Contact],\n\nAcre Era is developing a curated online marketplace for local farms, specialty-food producers, and independent suppliers. We are interested in organizations like [Business] that already coordinate products from multiple producers.\n\nWould you be open to a brief discussion about sourcing, producer introductions, wholesale terms, and logistics?\n\nBest regards,\nAcre Era Partnerships\ncontact@acreera.com" },
  { id: "followup", label: "Follow-up (only after initial contact)", subject: "Following up — Acre Era and [Business]", body: "Hello [Contact],\n\nI wanted to follow up on my earlier message about a possible partnership between Acre Era and [Business]. We'd still be glad to learn whether there might be a fit. If the timing isn't right, I understand.\n\nThank you,\nAcre Era Partnerships\ncontact@acreera.com" },
] as const;

export function ProducerOutreachTemplates() {
  const [kind, setKind] = useState<string>("farm");
  const [business, setBusiness] = useState("");
  const [region, setRegion] = useState("Oklahoma");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editedBody, setEditedBody] = useState<string | null>(null);
  const template = TEMPLATES.find((entry) => entry.id === kind) ?? TEMPLATES[0];
  const personalize = (value: string) => value.replaceAll("[Business]", business.trim() || "[Business]").replaceAll("[Contact]", contact.trim() || "[Contact]").replaceAll("[Region]", region.trim() || "[Region]");
  const subject = useMemo(() => personalize(template.subject), [template, business, contact]);
  const body = editedBody === null ? personalize(template.body) : editedBody;
  function changeKind(value: string) { setKind(value); setEditedBody(null); setFeedback(""); }
  async function copy() {
    try { await navigator.clipboard.writeText("Subject: " + subject + "\n\n" + body); setFeedback("Draft copied. Review it in your business email before sending."); }
    catch { setFeedback("Clipboard unavailable; select and copy the draft manually."); }
  }
  return (
    <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-200">Outreach studio · draft only</p>
      <h2 className="mt-2 font-display text-3xl font-black">Partner message templates</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Choose a category, personalize the message, and copy it into Zoho Mail. Messages are never sent by Watchtower. No HubSpot sync is implied. Verify the recipient and sender before outreach.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/70">Business category<select value={kind} onChange={e => changeKind(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#191b18] p-3 text-white">{TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <label className="text-sm text-white/70">State / region<select value={region} onChange={e => setRegion(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#191b18] p-3 text-white">{["Oklahoma","Texas","Arkansas","Kansas","Missouri","Colorado","New Mexico","Other US region"].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        <label className="text-sm text-white/70">Business name<input value={business} onChange={e => setBusiness(e.target.value)} placeholder="e.g. OKC Food Hub" className="mt-2 w-full rounded-xl border border-white/20 bg-black/20 p-3 text-white" /></label>
        <label className="text-sm text-white/70">Contact first name<input value={contact} onChange={e => setContact(e.target.value)} placeholder="First name, if verified" className="mt-2 w-full rounded-xl border border-white/20 bg-black/20 p-3 text-white" /></label>
        <label className="text-sm text-white/70">Recipient email (optional)<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Verify before use" className="mt-2 w-full rounded-xl border border-white/20 bg-black/20 p-3 text-white" /></label>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-xs uppercase tracking-widest text-white/40">Subject</p><div className="rounded-xl border border-white/15 bg-black/20 p-3 text-sm">{subject}</div>
        <label className="mt-4 block text-xs uppercase tracking-widest text-white/40">Editable message<textarea rows={13} value={body} onChange={e => setEditedBody(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-black/20 p-4 text-sm leading-6 text-white" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400">Copy draft</button>
        <button type="button" onClick={() => { setEditedBody(null); setFeedback("Template reset."); }} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Reset template</button>
        <a href="https://mail.zoho.com/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Open Zoho Mail ↗</a>
      </div>
      {email ? <p className="mt-3 text-xs text-amber-200">Recipient entered: {email}. This form does not send, save contacts, or validate consent.</p> : null}
      {feedback ? <p role="status" className="mt-3 text-sm text-indigo-200">{feedback}</p> : null}
    </section>
  );
}
