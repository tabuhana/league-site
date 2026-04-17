"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <span className="text-xs uppercase tracking-[0.45em] text-accent-red">
        Lane gank
      </span>
      <h1 className="font-(family-name:--font-display) text-5xl font-bold tracking-[0.15em] text-text-primary">
        Something went wrong
      </h1>
      <p className="max-w-md text-text-secondary">
        An unexpected error interrupted your request. Try again, or head back
        home.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={unstable_retry}
          className="rounded border border-accent-gold bg-accent-gold/10 px-5 py-2 text-sm uppercase tracking-widest text-accent-gold hover:bg-accent-gold hover:text-bg-primary transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-riven-border px-5 py-2 text-sm uppercase tracking-widest text-text-secondary hover:border-accent-gold hover:text-accent-gold transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
