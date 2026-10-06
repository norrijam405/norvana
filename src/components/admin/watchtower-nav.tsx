import Link from "next/link";

const ITEMS = [
  { href: "/admin/cockpit", label: "Cockpit" },
  { href: "/admin/money", label: "Money" },
  { href: "/admin/orders", label: "Orders + Delivery" },
  { href: "/admin/suppliers", label: "Brands + Suppliers" },
  { href: "/admin/connections", label: "Connections" },
  { href: "/admin/producers", label: "Farms + Producers" },
  { href: "/admin/era-studio", label: "Era Studio" },
  { href: "/admin/notifications", label: "Alerts" },
  { href: "/admin/system-health", label: "Advanced" },
];

export function WatchtowerNav({ current }: { current?: string }) {
  const mobileItems = [
    { href: "/admin/cockpit", label: "Home", icon: "⌂" },
    { href: "/admin/orders", label: "Orders", icon: "□" },
    { href: "/admin/money", label: "Money", icon: "$" },
    { href: "/admin/producers", label: "Farms", icon: "♧" },
    { href: "/admin/notifications", label: "Alerts", icon: "●" },
  ];

  return (
    <>
      <nav className="hidden overflow-x-auto border-b border-white/10 bg-[#0d0f0c]/95 backdrop-blur-md md:block">
        <div className="mx-auto flex min-w-max max-w-7xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
          {ITEMS.map((item) => {
          const active = current === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "rounded-lg px-3 py-2 text-sm font-medium transition " +
                (active
                  ? "bg-indigo-500 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white")
              }
            >
              {item.label}
            </Link>
          );
          })}
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0d0f0c]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const active = current === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold transition " +
                  (active ? "bg-indigo-500 text-white" : "text-white/45 active:bg-white/10 active:text-white")
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
