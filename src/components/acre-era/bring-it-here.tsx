"use client";

import { FormEvent, useState } from "react";

type State =
  | { kind: "idle"; message: "" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function BringItHere() {
  const [state, setState] = useState<State>({ kind: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState({ kind: "idle", message: "" });

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      category: String(form.get("category") || "product"),
      note: String(form.get("note") || ""),
    };

    try {
      const response = await fetch("/api/market-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || "We could not save that request.");
      }

      setState({
        kind: "success",
        message: body?.message || "Request counted. Acre Era can now watch for demand.",
      });
      event.currentTarget.reset();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "We could not save that request.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] bg-soil p-7 text-cream md:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">Bring It Here</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Help decide what Acre Era becomes.
          </h2>
          <p className="mt-4 max-w-xl text-cream/70">
            Ask for a product, farm, maker, or category. Repeated requests help Acre Era understand what customers actually want us to source next. A request is a signal, not a promise that an item will be added.
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-3 rounded-3xl bg-cream p-5 text-soil md:grid-cols-[1fr_180px]">
          <input
            className="input md:col-span-1"
            name="title"
            minLength={2}
            maxLength={120}
            required
            placeholder="What should we bring here?"
          />
          <select name="category" className="input" defaultValue="product">
            <option value="product">Product</option>
            <option value="farm">Farm / grower</option>
            <option value="maker">Maker / local business</option>
            <option value="category">Category</option>
          </select>
          <textarea
            name="note"
            maxLength={500}
            className="input min-h-24 md:col-span-2"
            placeholder="Optional: what makes it worth adding?"
          />
          <button disabled={submitting} className="btn-primary md:col-span-2" type="submit">
            {submitting ? "Planting request…" : "Plant the request"}
          </button>
          {state.kind !== "idle" && (
            <p
              className={`text-sm md:col-span-2 ${state.kind === "success" ? "text-leaf" : "text-error"}`}
              role="status"
            >
              {state.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
