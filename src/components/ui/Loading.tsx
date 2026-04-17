import { cn } from "@/lib/utils";

type Variant = "profile" | "matchCard" | "statsCard" | "matchupCard";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-bg-tertiary rounded",
        className,
      )}
    />
  );
}

export function Loading({
  variant = "matchCard",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "profile") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-md border border-riven-border bg-bg-secondary p-6",
          className,
        )}
      >
        <Bar className="size-20 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Bar className="h-6 w-48" />
          <Bar className="h-4 w-32" />
          <Bar className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (variant === "statsCard") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-riven-border bg-bg-secondary p-5",
          className,
        )}
      >
        <Bar className="h-4 w-28" />
        <Bar className="h-9 w-20" />
        <div className="flex gap-2">
          <Bar className="h-3 flex-1" />
          <Bar className="h-3 flex-1" />
        </div>
      </div>
    );
  }

  if (variant === "matchupCard") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-riven-border bg-bg-secondary p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <Bar className="size-12 rounded" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bar className="h-4 w-24" />
            <Bar className="h-3 w-16" />
          </div>
        </div>
        <Bar className="h-2 w-full" />
        <div className="flex justify-between gap-2">
          <Bar className="h-3 w-14" />
          <Bar className="h-3 w-14" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-md border border-riven-border bg-bg-secondary p-4",
        className,
      )}
    >
      <Bar className="size-12 rounded" />
      <div className="flex flex-1 flex-col gap-2">
        <Bar className="h-4 w-40" />
        <Bar className="h-3 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Bar className="h-4 w-16" />
        <Bar className="h-3 w-12" />
      </div>
    </div>
  );
}
