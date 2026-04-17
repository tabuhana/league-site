"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground">Something went wrong.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-3 py-1 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
