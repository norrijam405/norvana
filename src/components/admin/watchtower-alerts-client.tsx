"use client";

import { useEffect, useMemo, useState } from "react";

type PrefKey =
  | "orders"
  | "delivery"
  | "money"
  | "farms"
  | "connections"
  | "approvals";

type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = {
  orders: true,
  delivery: true,
  money: true,
  farms: true,
  connections: false,
  approvals: true,
};

const STORAGE_KEY = "acre-era-watchtower-alert-preferences-r0";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function WatchtowerAlertsClient() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [standalone, setStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");

  const enabledCount = useMemo(
    () => Object.values(prefs).filter(Boolean).length,
    [prefs]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs((current) => ({ ...current, ...parsed }));
      }
    } catch {}

    if ("Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setStandalone(isStandalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  function toggle(key: PrefKey) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }

  async function requestNotifications() {
    setMessage("");
    if (!("Notification" in window)) {
      setPermission("unsupported");
      setMessage("This browser does not expose system notifications.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setMessage("Notifications are allowed on this device.");
    } else if (result === "denied") {
      setMessage("Notifications are blocked. You can change that in this device's site/app settings.");
    }
  }

  async function testNotification() {
    setMessage("");
    if (permission !== "granted") {
      setMessage("Allow notifications first.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Acre Era Watchtower", {
        body: "Test passed. This is how an owner alert can reach your phone.",
        icon: "/watchtower-icon.svg",
        badge: "/watchtower-icon.svg",
        tag: "watchtower-test",
        data: { url: "/admin/cockpit" },
      });
      setMessage("Test notification sent.");
    } catch {
      setMessage("The notification could not be displayed on this browser.");
    }
  }

  async function installApp() {
    setMessage("");
    if (!installEvent) {
      setMessage(
        "If you're on iPhone, use Share → Add to Home Screen. On Android, use your browser's Install/Add to Home Screen option."
      );
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setMessage(choice.outcome === "accepted" ? "Watchtower added to this device." : "Install dismissed.");
    setInstallEvent(null);
  }

  const rows: Array<{ key: PrefKey; title: string; detail: string; level: string }> = [
    {
      key: "orders",
      title: "Order problems",
      detail: "Unpaid orders, failed handoffs, cancellations, or something blocking fulfillment.",
      level: "HIGH",
    },
    {
      key: "delivery",
      title: "Delivery problems",
      detail: "Late shipments, tracking exceptions, failed delivery quotes, or route trouble.",
      level: "HIGH",
    },
    {
      key: "money",
      title: "Money problems",
      detail: "Failed payments, refunds, unusual margin pressure, or something that could cost money.",
      level: "HIGH",
    },
    {
      key: "farms",
      title: "Farm follow-ups",
      detail: "A producer needs a callback, submitted interest, or is waiting on the next step.",
      level: "NORMAL",
    },
    {
      key: "connections",
      title: "Connection health",
      detail: "An API or outside service stopped working or needs credentials.",
      level: "NORMAL",
    },
    {
      key: "approvals",
      title: "Needs your approval",
      detail: "Watchtower has a recommendation but will not act until you approve it.",
      level: "HIGH",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Phone setup</p>
            <h2 className="mt-2 font-display text-3xl font-black">Put Watchtower on this phone.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              Install it like an app, then allow notifications. You stay in control of what can interrupt you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={installApp}
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                {standalone ? "Installed on this device" : "Install Watchtower"}
              </button>
              <button
                type="button"
                onClick={requestNotifications}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10"
              >
                Allow notifications
              </button>
              <button
                type="button"
                onClick={testNotification}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10"
              >
                Send test
              </button>
            </div>
            {message ? <p className="mt-4 text-sm text-indigo-200">{message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["App mode", standalone ? "INSTALLED" : "BROWSER"],
              ["Permission", String(permission).toUpperCase()],
              ["Alert types on", String(enabledCount)],
              ["Background push", "PREPARED"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white/80">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">What can interrupt me?</p>
          <h2 className="mt-2 font-display text-3xl font-black">Alert preferences</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            High-value operational alerts only. No marketing noise and no notification for every watcher observation.
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => toggle(row.key)}
              className={
                "flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition " +
                (prefs[row.key]
                  ? "border-indigo-300/25 bg-indigo-300/[0.07]"
                  : "border-white/10 bg-black/20")
              }
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-white">{row.title}</h3>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
                    {row.level}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/45">{row.detail}</p>
              </div>
              <span
                className={
                  "mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition " +
                  (prefs[row.key] ? "justify-end bg-indigo-500" : "justify-start bg-white/10")
                }
              >
                <span className="h-5 w-5 rounded-full bg-white" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-300/15 bg-amber-300/[0.05] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Background delivery</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
          The phone/app shell and notification permission are ready. Actual server-triggered background push stays fail-closed until the owner-only subscription store and push credentials are explicitly enabled.
        </p>
      </section>
    </div>
  );
}
