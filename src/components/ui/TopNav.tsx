"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/goals", label: "Obiettivi" },
  { href: "/workouts", label: "Allenamento" },
];

export function TopNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="mb-8 flex items-center justify-between border-b border-ink-line/70 pb-5">
      <div className="flex items-center gap-8">
        <a href="/dashboard" className="font-display text-lg font-semibold text-paper">
          FitQuest
        </a>
        <nav className="hidden gap-1 sm:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-ink-panel text-paper" : "text-paper-muted hover:text-paper"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {userName && <span className="hidden text-sm text-paper-muted sm:inline">Ciao, {userName}</span>}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-paper-muted transition-colors hover:text-paper"
        >
          Esci
        </button>
      </div>
    </header>
  );
}
