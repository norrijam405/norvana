'use client';

import { FormEvent, useMemo, useState } from "react";

const PRODUCT_OPTIONS = [
  "Produce",
  "Meat / eggs / dairy",
  "Baked goods",
  "Pantry goods",
  "Plants / garden",
  "Personal care",
  "Pet products",
  "Home goods",
  "Other",
] as const;

const FULFILLMENT_OPTIONS = [
  "Customer pickup",
  "Producer delivery",
  "Acre Era pickup",
  "Scheduled local route",
  "Parcel shipping",
  "Refrigerated / frozen delivery",
] as const;

export function ProducerInterestForm() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [products, setProducts] = useState<string[]>([]);
  const [fulfillment, setFulfillment] = useState<string[]>([]);

  const progress = useMemo(() => Math.round((step / 4) * 100), [step]);

  function toggle(value: string, current: string[], setCurrent: (value: string[]) => void) {
    setCurrent(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setPending(true);

    const data = new FormData(event.currentTarget);
    const payload = {
      businessName: String(data.get("businessName") || ""),
      contactName: String(data.get("contactName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      location: String(data.get("location") || ""),
      website: String(data.get("website") || ""),
      productCategories: products,
      seasonality: String(data.get("seasonality") || ""),
      salesModel: String(data.get("salesModel") || "UNKNOWN"),
      fulfillmentModes: fulfillment,
      leadTimeNotes: String(data.get("leadTimeNotes") || ""),
      capacityNotes: String(data.get("capacityNotes") || ""),
      painPoint: String(data.get("painPoint") || ""),
      pilotInterest: String(data.get("pilotInterest") || "YES"),
      mediaInterest: String(data.get("mediaInterest") || "DISCUSS"),
    };

    try {
      const response = await fetch("/api/producer-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(body.error || "We could not save your interest right now.");
        return;
      }

      setStatus("Thanks — your information is in for review. Nothing goes public and no pilot starts until we talk with you.");
      setStep(4);
      event.currentTarget.reset();
      setProducts([]);
      setFulfillment([]);
    } catch {
      setStatus("We could not reach Acre Era right now. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="interest" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
        <div className="rounded-[2rem] bg-soil p-8 text-cream md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Producer interest</p>
          <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em]">
            Raise your hand. That&apos;s all this form does.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/70">
            Submitting this does not make you an approved partner, publish your farm, or commit you to a contract.
            It gives Acre Era enough information to understand whether a small pilot conversation makes sense.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            {[
              "Your information stays in the producer review inbox.",
              "We do not publish a farm or product from this form alone.",
              "You can start with a small pilot instead of a large commitment.",
              "Pricing, delivery, media, and responsibilities are discussed before anything goes live.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-cream/10 bg-cream/5 px-4 py-3 text-cream/78">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] border border-soil/10 bg-cream p-7 shadow-sm md:p-10">
          <div className="mb-7">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <span>Step {step} of 4</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bone">
              <div className="h-full rounded-full bg-leaf transition-all" style={{ width: progress + "%" }} />
            </div>
          </div>

          <div className={step === 1 ? "block" : "hidden"}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">About you</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-soil">Who are we talking with?</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field name="businessName" label="Farm / business name" required />
              <Field name="contactName" label="Your name" required />
              <Field name="email" type="email" label="Email" required />
              <Field name="phone" label="Phone (optional)" />
              <Field name="location" label="City + state" required className="sm:col-span-2" />
              <Field name="website" label="Website or social page (optional)" className="sm:col-span-2" />
            </div>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">What you produce</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-soil">What should customers know you for?</h3>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRODUCT_OPTIONS.map((option) => (
                <Toggle
                  key={option}
                  active={products.includes(option)}
                  onClick={() => toggle(option, products, setProducts)}
                >
                  {option}
                </Toggle>
              ))}
            </div>
            <label className="mt-5 block text-sm font-medium text-soil">
              What is seasonal vs. regularly available?
              <textarea name="seasonality" rows={4} className="input mt-2 w-full" placeholder="Example: peaches May–July, eggs year-round..." />
            </label>
            <label className="mt-4 block text-sm font-medium text-soil">
              How do you sell today?
              <select name="salesModel" className="input mt-2 w-full" defaultValue="BOTH">
                <option value="RETAIL">Retail / direct-to-customer</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="BOTH">Both</option>
                <option value="OTHER">Something else</option>
              </select>
            </label>
          </div>

          <div className={step === 3 ? "block" : "hidden"}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Getting it to customers</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-soil">What could fulfillment look like?</h3>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FULFILLMENT_OPTIONS.map((option) => (
                <Toggle
                  key={option}
                  active={fulfillment.includes(option)}
                  onClick={() => toggle(option, fulfillment, setFulfillment)}
                >
                  {option}
                </Toggle>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextArea name="leadTimeNotes" label="How much notice do you usually need?" placeholder="Example: orders by Tuesday for Thursday pickup" />
              <TextArea name="capacityNotes" label="What volume could you comfortably handle?" placeholder="No need to promise a maximum — just what feels realistic." />
            </div>
          </div>

          <div className={step === 4 ? "block" : "hidden"}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">The fit</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-soil">What would make this worth doing?</h3>
            <TextArea
              name="painPoint"
              label="What is the biggest pain in the ass about selling what you produce today?"
              placeholder="Delivery, finding customers, predictable orders, packaging, wholesale margins..."
              className="mt-6"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-soil">
                Open to a small pilot?
                <select name="pilotInterest" className="input mt-2 w-full" defaultValue="YES">
                  <option value="YES">Yes</option>
                  <option value="MAYBE">Maybe — let&apos;s talk</option>
                  <option value="NO">Not right now</option>
                </select>
              </label>
              <label className="text-sm font-medium text-soil">
                Open to photos / video later?
                <select name="mediaInterest" className="input mt-2 w-full" defaultValue="DISCUSS">
                  <option value="DISCUSS">Open to discussing it</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-2xl bg-sage-wash p-4 text-sm leading-6 text-soil">
              Nothing goes public from this submission alone. Acre Era reviews it first and talks with you before any pilot, listing, or media use.
            </div>
          </div>

          {status ? <p className="mt-5 rounded-xl bg-bone p-4 text-sm leading-6 text-soil">{status}</p> : null}

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              className="btn-secondary"
              disabled={step === 1 || pending}
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && products.length === 0) {
                    setStatus("Choose at least one product category before continuing.");
                    return;
                  }
                  setStatus("");
                  setStep((value) => Math.min(4, value + 1));
                }}
                className="btn-primary"
              >
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={pending || products.length === 0}>
                {pending ? "Sending…" : "Send producer interest"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  className = "",
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={"block text-sm font-medium text-soil " + className}>
      {label}
      <input name={name} type={type} required={required} className="input mt-2 w-full" />
    </label>
  );
}

function TextArea({
  name,
  label,
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={"block text-sm font-medium text-soil " + className}>
      {label}
      <textarea name={name} rows={4} className="input mt-2 w-full" placeholder={placeholder} />
    </label>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border px-3 py-3 text-left text-sm font-medium transition " +
        (active
          ? "border-leaf bg-sage-wash text-soil"
          : "border-soil/10 bg-bone text-muted hover:border-leaf/30 hover:text-soil")
      }
    >
      {children}
    </button>
  );
}
