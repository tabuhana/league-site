import { cn } from "@/lib/utils";

type Level = "easy" | "medium" | "hard";

const styles: Record<Level, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  hard: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

const labels: Record<Level, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function DifficultyBadge({ level }: { level: Level }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[level],
      )}
    >
      {labels[level]}
    </span>
  );
}
