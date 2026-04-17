import { Check, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TipType = "do" | "dont" | "info";

const styles: Record<TipType, { wrap: string; icon: string }> = {
  do: {
    wrap: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    icon: "text-emerald-400",
  },
  dont: {
    wrap: "border-rose-500/40 bg-rose-500/10 text-rose-100",
    icon: "text-rose-400",
  },
  info: {
    wrap: "border-sky-500/40 bg-sky-500/10 text-sky-100",
    icon: "text-sky-400",
  },
};

const icons: Record<TipType, typeof Check> = {
  do: Check,
  dont: X,
  info: Info,
};

export function TipBlock({
  type,
  children,
}: {
  type: TipType;
  children: ReactNode;
}) {
  const Icon = icons[type];
  const style = styles[type];
  return (
    <div
      className={cn(
        "my-4 flex gap-3 rounded-md border-l-4 px-4 py-3",
        style.wrap,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", style.icon)} />
      <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
