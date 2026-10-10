"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./cart-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market Era" },
  { href: "/shop", label: "Goods Era" },
  { href: "/partners", label: "Finds Era" },
  { href: "/era-drops", label: "Era Drop" },
  { href: "/archive", label: "Past Eras" },
];

export function Navbar() {
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-soil/10 bg-cream/88 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2 text-soil">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[0.65rem] bg-cream ring-1 ring-soil/10 transition group-hover:-rotate-2">
            <Image src="/brand/acre-era-mark.svg" alt="" width={32} height={32} priority />
          </span>
          <span className="font-display text-base font-black tracking-[-.02em] sm:text-lg">ACRE ERA</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : !link.href.includes("#") && pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "text-sm font-medium transition " +
                  (active ? "text-leaf" : "text-muted hover:text-soil")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden rounded-full border border-soil/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted transition hover:border-soil/20 hover:bg-sage-wash hover:text-soil sm:inline-flex"
          >
            Admin
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full p-2.5 transition hover:bg-sage-wash"
            aria-label="Open cart"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-clay text-xs font-bold text-cream">
                {itemCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2.5 transition hover:bg-sage-wash md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="acre-era-mobile-nav"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            id="acre-era-mobile-nav"
            className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-soil/10 bg-cream md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ? "bg-sage-wash text-soil" : "text-muted hover:bg-sage-wash hover:text-soil"}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-soil/10" />
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-soil/70 hover:bg-sage-wash hover:text-soil"
              >
                Admin / Watchtower
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
