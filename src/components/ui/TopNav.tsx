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
    <header className="mb-6 border-b border-ink-line/70 pb-4 sm:mb-8 sm:pb-5">
      <div className="flex items-center justify-between">
        <a href="/dashboard" className="font-display text-lg font-semibold text-paper">
          FitQuest
        </a>
        <div className="flex items-center gap-3 sm:gap-4">
          {userName && <span className="hidden text-sm text-paper-muted sm:inline">Ciao, {userName}</span>}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-paper-muted transition-colors hover:text-paper"
          >
            Esci
          </button>
        </div>
      </div>

      <nav className="mt-3 flex gap-1 overflow-x-auto sm:mt-3">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                active ? "bg-ink-panel text-paper" : "text-paper-muted hover:text-paper"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
