import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { ProducerInterestForm } from "@/components/acre-era/producer-interest-form";

export const metadata: Metadata = {
  title: "For Growers and Local Producers",
  description: "Learn how Acre Era can pilot practical partnerships with growers and local producers using clear pricing, availability, pickup, delivery, and evidence-first growth.",
  alternates: { canonical: "/growers" },
  openGraph: {
    title: "For Growers and Local Producers | Acre Era",
    description: "Learn how Acre Era can pilot practical partnerships with growers and local producers using clear pricing, availability, pickup, delivery, and evidence-first growth.",
    url: "/growers",
  },
};

export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    title: "More customers without becoming a tech company",
    body: "Acre Era can help people discover what you already grow or make while you stay focused on the product.",
  },
  {
    title: "Start small before anybody overcommits",
    body: "We would rather test a limited pilot, learn the real demand and delivery costs, and grow from evidence than make giant promises on day one.",
  },
  {
    title: "Your story stays attached to your food",
    body: "When you want it, customers can learn where products came from, what is seasonal, and what makes your farm or business different.",
  },
  {
    title: "Flexible pickup and delivery models",
    body: "Farm pickup, scheduled neighborhood routes, community drop-offs, producer delivery, and other workable options can be evaluated case by case.",
  },
];

const PILOT_STEPS = [
  "Learn what you grow or make and when it is available.",
  "Agree on a small group of products worth testing.",
  "Set clear pricing, minimums, pickup timing, and packaging expectations.",
  "Run a limited customer pilot.",
  "Review what sold, what delivery actually cost, and what should change.",
  "Only expand if the numbers and experience work for both sides.",
];

const QUESTIONS = [
  "What do you produce throughout the year, and what is seasonal?",
  "Do you already sell wholesale, direct-to-consumer, or both?",
  "How much notice do you need before an order is ready?",
  "Do you offer pickup, local delivery, shipping, or any combination?",
  "What volume can you comfortably handle without hurting quality?",
  "What products are hardest to transport or have the shortest shelf life?",
  "Would you be open to a small pilot before anything bigger?",
];

export default function GrowersPage() {
  const submissionEnabled = process.env.PRODUCER_INTEREST_INTAKE_ENABLED === "true";
  return (
    <>
      <main className="min-h-screen bg-bone">
        <section className="relative isolate overflow-hidden bg-soil text-cream">
          <div className="absolute inset-0 acre-contours opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">
              For growers + local producers
            </p>
            <h1 className="mt-4 max-w-5xl font-display text-5xl font-black leading-[.96] tracking-[-0.04em] md:text-7xl">
              Let&apos;s see if we can help more people buy what you already do well.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-cream/75 md:text-lg">
              Acre Era is building a marketplace for useful everyday goods, seasonal food, local producers, and products people actually want. We are looking for practical partnerships, not complicated promises.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/market" className="btn-primary !bg-wheat !text-soil hover:!bg-cream">
                See the Market
              </Link>
              <a href="#pilot" className="btn-ghost-light">
                See how a pilot works
              </a>
            </div>
          </div>
        </section>

        <section id="delivery" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-5 md:grid-cols-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-soil/10 bg-cream p-7 shadow-sm md:p-8">
                <h2 className="font-display text-2xl font-bold text-soil">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pilot" className="border-y border-soil/10 bg-sage-wash">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Small pilot first</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-soil">
                No giant commitment just to find out whether this works.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                The first goal is simple: prove that customers want the product, prove that the delivery path works, and prove that everybody can still make money.
              </p>
            </div>
            <ol className="space-y-3">
              {PILOT_STEPS.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl bg-cream p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soil text-sm font-bold text-wheat">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-soil">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-[2rem] bg-cream p-8 shadow-sm ring-1 ring-soil/10 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">What we would ask</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-soil">A normal conversation, not a corporate interrogation.</h2>
              <div className="mt-6 space-y-3">
                {QUESTIONS.map((question) => (
                  <div key={question} className="rounded-xl bg-bone px-4 py-3 text-sm leading-6 text-soil">
                    {question}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-soil p-8 text-cream md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">What stays clear</p>
              <h2 className="mt-3 font-display text-3xl font-bold">You should always know what you are agreeing to.</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-cream/75">
                <p>You keep control of what you agree to sell and what quantity you can realistically support.</p>
                <p>Pricing, pickup timing, delivery responsibilities, packaging, payment timing, and media permissions should be clear before a live pilot starts.</p>
                <p>Acre Era will not represent a farm, product, delivery promise, or local-source claim as confirmed unless it actually is.</p>
              </div>
              <div className="mt-8 rounded-2xl border border-cream/10 bg-cream/5 p-5">
                <p className="text-sm font-semibold text-wheat">The goal</p>
                <p className="mt-2 text-sm leading-6 text-cream/75">
                  Lower waste, useful demand, fair economics, and a customer experience good enough that people come back.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ProducerInterestForm submissionEnabled={submissionEnabled} />

        <section className="border-t border-soil/10 bg-cream">
          <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Acre Era Market</p>
            <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-black tracking-[-0.03em] text-soil">
              Start with a few products. Learn what works. Grow from there.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">
              That is the kind of partnership Acre Era is trying to build.
            </p>
            <Link href="/market" className="btn-primary mt-7 inline-flex">
              See the customer side
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
