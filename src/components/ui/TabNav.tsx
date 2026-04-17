"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type TabItem = {
  label: string;
  value: string;
  href: string;
};

export function TabNav({
  tabs,
  paramKey = "tab",
  defaultValue,
}: {
  tabs: TabItem[];
  paramKey?: string;
  defaultValue: string;
}) {
  const params = useSearchParams();
  const raw = params.get(paramKey) ?? defaultValue;
  const known = tabs.map((t) => t.value);
  const active = known.includes(raw) ? raw : defaultValue;

  return (
    <nav className="border-b border-riven-border bg-bg-secondary/40">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-1 px-6">
        {tabs.map((tab) => {
          const isActive = tab.value === active;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "relative px-4 py-3 text-sm uppercase tracking-widest transition-colors",
                isActive
                  ? "text-accent-gold"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent-gold" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
