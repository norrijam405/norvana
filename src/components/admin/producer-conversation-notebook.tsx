'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";

type Answers = Record<string, string | boolean>;

const GROUPS = [
  {
    title: "What they produce",
    eyebrow: "Supply",
    questions: [
      ["products", "What do you grow or produce throughout the year? What is seasonal?"],
      ["salesModel", "Are you mainly retail, wholesale, or both today?"],
      ["capacity", "What volume can you comfortably handle without hurting quality?"],
      ["pricing", "Do you already have wholesale, case, or volume pricing?"],
      ["minimums", "Do you have a minimum order?"],
      ["inventory", "How often does inventory change, and how do you track what is available?"],
    ],
  },
  {
    title: "How orders could move",
    eyebrow: "Fulfillment",
    questions: [
      ["leadTime", "How much notice do you need before an order is ready for pickup?"],
      ["delivery", "Do you already deliver? If so, where and on which days?"],
      ["groupedRoute", "Would you be open to scheduled pickup of multiple customer orders for a grouped route?"],
      ["packaging", "How are products currently packed for retail or wholesale customers?"],
      ["hardToMove", "Which products are hardest to transport or have the shortest shelf life?"],
      ["shipping", "Do you currently ship anything? If so, where and through whom?"],
    ],
  },
  {
    title: "Safety + reach",
    eyebrow: "Readiness",
    questions: [
      ["foodSafety", "What food-safety, insurance, licensing, or inspection records do buyers usually ask you for?"],
      ["localOnly", "Are there products you prefer to keep local rather than ship farther away?"],
      ["nationalInterest", "Would you eventually be interested in selling outside your current region?"],
      ["coldChain", "Which products require refrigeration, freezing, or other temperature control?"],
    ],
  },
  {
    title: "Story + partnership",
    eyebrow: "Fit",
    questions: [
      ["mediaPermission", "Would you allow Acre Era to use your farm or business name, story, photos, or video?"],
      ["originalMedia", "Would you be open to Acre Era creating original photos or short video at your location?"],
      ["payment", "How do you prefer to be paid?"],
      ["value", "What would make a partnership like this valuable to you?"],
      ["painPoint", "What is the biggest pain in the ass about selling what you produce today?"],
      ["pilot", "Would you be open to a small pilot before either side commits to anything larger?"],
    ],
  },
] as const;

const DRAFT_KEY = "acre-era-producer-conversation-draft-r0";

export function ProducerConversationNotebook({
  persistenceEnabled,
}: {
  persistenceEnabled: boolean;
}) {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactMethod, setContactMethod] = useState("PHONE");
  const [conversationStage, setConversationStage] = useState("INTRO");
  const [pilotRecommendation, setPilotRecommendation] = useState("UNDECIDED");
  const [answers, setAnswers] = useState<Answers>({});
  const [operatorSummary, setOperatorSummary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const payload = useMemo(
    () => ({
      businessName,
      contactName,
      contactMethod,
      conversationStage,
      pilotRecommendation,
      answers,
      operatorSummary,
      nextStep,
    }),
    [
      businessName,
      contactName,
      contactMethod,
      conversationStage,
      pilotRecommendation,
      answers,
      operatorSummary,
      nextStep,
    ]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<typeof payload>;
      if (typeof draft.businessName === "string") setBusinessName(draft.businessName);
      if (typeof draft.contactName === "string") setContactName(draft.contactName);
      if (typeof draft.contactMethod === "string") setContactMethod(draft.contactMethod);
      if (typeof draft.conversationStage === "string") setConversationStage(draft.conversationStage);
      if (typeof draft.pilotRecommendation === "string") setPilotRecommendation(draft.pilotRecommendation);
      if (draft.answers && typeof draft.answers === "object") setAnswers(draft.answers as Answers);
      if (typeof draft.operatorSummary === "string") setOperatorSummary(draft.operatorSummary);
      if (typeof draft.nextStep === "string") setNextStep(draft.nextStep);
    } catch {
      // Browser draft is convenience only. Ignore malformed local data.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        // Keep the live form usable even when browser storage is unavailable.
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [payload]);

  function updateAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function clearDraft() {
    setBusinessName("");
    setContactName("");
    setContactMethod("PHONE");
    setConversationStage("INTRO");
    setPilotRecommendation("UNDECIDED");
    setAnswers({});
    setOperatorSummary("");
    setNextStep("");
    setStatus("New blank conversation started.");
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  async function copyNotes() {
    const lines = [
      `Farm / producer: ${businessName || "—"}`,
      `Contact: ${contactName || "—"}`,
      `Method: ${contactMethod}`,
      `Stage: ${conversationStage}`,
      "",
      ...GROUPS.flatMap((group) => [
        `## ${group.title}`,
        ...group.questions.flatMap(([key, question]) => [
          question,
          String(answers[key] || "—"),
          "",
        ]),
      ]),
      "## Operator summary",
      operatorSummary || "—",
      "",
      "## Next step",
      nextStep || "—",
      "",
      `Pilot recommendation: ${pilotRecommendation}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("Conversation notes copied.");
    } catch {
      setStatus("Could not copy notes from this browser.");
    }
  }

  async function saveConversation(event: FormEvent) {
    event.preventDefault();

    if (!businessName.trim()) {
      setStatus("Add the farm / producer name first.");
      return;
    }

    if (!persistenceEnabled) {
      setStatus("Saved as a browser draft. Server-backed Watchtower history is not enabled yet.");
      return;
    }

    setPending(true);
    setStatus("Saving conversation to Watchtower…");

    try {
      const response = await fetch("/api/admin/producer-conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(body.error || "Could not save conversation.");
        return;
      }

      setStatus("Conversation banked in Watchtower.");
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {}
    } catch {
      setStatus("Could not reach Watchtower right now. Your browser draft is still here.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={saveConversation} className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Producer conversations</p>
            <h2 className="mt-2 font-display text-3xl font-black text-white">Call notebook</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Use this while you are talking with a farm, food hub, maker, or producer. The public form stays short; this is where the detailed conversation lives.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyNotes} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
              Copy notes
            </button>
            <button type="button" onClick={clearDraft} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
              New conversation
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Farm / producer" value={businessName} onChange={setBusinessName} placeholder="Example Farm" />
          <Field label="Contact" value={contactName} onChange={setContactName} placeholder="Name" />
          <Select label="Method" value={contactMethod} onChange={setContactMethod} options={[
            ["PHONE", "Phone"],
            ["IN_PERSON", "In person"],
            ["VIDEO", "Video call"],
            ["EMAIL", "Email"],
            ["TEXT", "Text"],
          ]} />
          <Select label="Stage" value={conversationStage} onChange={setConversationStage} options={[
            ["INTRO", "Introduction"],
            ["DISCOVERY", "Discovery"],
            ["FOLLOW_UP", "Follow-up"],
            ["PILOT_PLANNING", "Pilot planning"],
          ]} />
          <Select label="Pilot read" value={pilotRecommendation} onChange={setPilotRecommendation} options={[
            ["UNDECIDED", "Undecided"],
            ["PROMISING", "Promising"],
            ["NEEDS_WORK", "Needs work"],
            ["NOT_A_FIT", "Not a fit"],
          ]} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">{group.eyebrow}</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">{group.title}</h3>
            <div className="mt-5 space-y-4">
              {group.questions.map(([key, question]) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium leading-6 text-white/78">{question}</span>
                  <textarea
                    value={String(answers[key] || "")}
                    onChange={(event) => updateAnswer(key, event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-300/50"
                    placeholder="Take notes here…"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <label className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Your read</span>
          <span className="mt-2 block font-display text-2xl font-bold text-white">Operator summary</span>
          <textarea
            value={operatorSummary}
            onChange={(event) => setOperatorSummary(event.target.value)}
            rows={7}
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-300/50"
            placeholder="What stood out? What feels strong? What worries you?"
          />
        </label>

        <label className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Continuation</span>
          <span className="mt-2 block font-display text-2xl font-bold text-white">Next step</span>
          <textarea
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            rows={7}
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-300/50"
            placeholder="Send pilot outline Friday, request wholesale sheet, visit farm, call back after harvest…"
          />
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {persistenceEnabled ? "Watchtower history enabled" : "Browser draft mode"}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            {persistenceEnabled
              ? "Completed conversations can be banked as append-only Watchtower records."
              : "Your current draft is saved on this device. Durable server history stays locked until its persistence path is approved."}
          </p>
          {status ? <p className="mt-2 text-xs text-indigo-200">{status}</p> : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {pending ? "Saving…" : persistenceEnabled ? "Bank conversation" : "Save browser draft"}
        </button>
      </section>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-300/50"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#171916] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}
