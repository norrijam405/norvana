import Link from "next/link";

const ITEMS = [
  { href: "/admin", label: "Cockpit" },
  { href: "/admin/money", label: "Money" },
  { href: "/admin/orders", label: "Orders + Delivery" },
  { href: "/admin/suppliers", label: "Brands + Suppliers" },
  { href: "/admin/connections", label: "Connections" },
  { href: "/admin/producers", label: "Producer CRM" },
  { href: "/admin/era-studio", label: "Era Studio" },
  { href: "/admin/system-health", label: "System Health" },
];

export function WatchtowerNav({ current }: { current?: string }) {
  return (
    <nav className="overflow-x-auto border-b border-white/10 bg-[#0d0f0c]/95 backdrop-blur-md">
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
  );
}
