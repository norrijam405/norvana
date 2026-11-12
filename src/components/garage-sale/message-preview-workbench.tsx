"use client";
import { useState } from "react";
import { DEMO_MESSAGE_TEMPLATES, demoMessageFromTemplate, messagePreviewGuard, type DemoMessage } from "@/lib/garage-sale/message-preview";

export function MessagePreviewWorkbench() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [notice, setNotice] = useState("");
  function showExample(id: string) {
    const result = demoMessageFromTemplate(id);
    if (!result) { setNotice("This conversation example is not available."); return; }
    setMessages(previous => [...previous.slice(-5), result]);
    setNotice("Local preview only. No seller has received anything.");
  }
  return <section aria-labelledby="garage-message-title" className="mt-7 rounded-[2rem] border border-soil/10 bg-cream p-6 md:p-9">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf">Buyer–seller communication · concept preview</p>
    <h2 id="garage-message-title" className="mt-2 font-display text-3xl font-black">Ask without sharing private details.</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
      Explore prewritten conversation examples. They stay in this browser session and are never delivered.
      Real private messaging requires identity checks, rate limits, block/report tools, anti-harassment controls, and a privacy review.
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      {DEMO_MESSAGE_TEMPLATES.map(template => <button type="button" key={template.id} onClick={() => showExample(template.id)}
        className="rounded-xl border border-soil/20 bg-bone px-4 py-3 text-sm font-semibold hover:border-leaf">{template.label}</button>)}
    </div>
    <div className="mt-5 rounded-2xl bg-sage-wash p-5">
      <h3 className="font-semibold">Example conversation · not sent</h3>
      {messages.length ? <ul className="mt-3 space-y-2">
        {messages.map((message, i) => <li key={i} className="max-w-xl rounded-xl bg-cream p-3 text-sm">
          <p className="text-xs font-bold text-muted">{message.role} · DRAFT ONLY</p>
          <p className="mt-1">{message.text}</p>
        </li>)}
      </ul> : <p className="mt-2 text-sm text-muted">Choose a sample question above. No real sellers or accounts are involved.</p>}
      {notice && <p role="status" className="mt-3 text-xs font-semibold text-soil">{notice}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => {setMessages([]);setNotice("");}} className="rounded-lg border border-soil/20 px-4 py-2 text-sm">Clear examples</button>
        <span className="text-xs font-bold text-clay">Send disabled · {messagePreviewGuard().code}</span>
      </div>
    </div>
  </section>;
}
