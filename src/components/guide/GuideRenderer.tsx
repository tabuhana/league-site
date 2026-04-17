import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GuideRenderer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "prose prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-50",
        "prose-h1:text-4xl prose-h1:mb-2 prose-h1:flex prose-h1:items-center prose-h1:gap-3",
        "prose-h2:mt-10 prose-h2:text-2xl prose-h2:border-b prose-h2:border-rose-500/20 prose-h2:pb-2",
        "prose-h3:mt-6 prose-h3:text-lg prose-h3:text-rose-200/90",
        "prose-p:text-zinc-300 prose-p:leading-relaxed",
        "prose-strong:text-zinc-100",
        "prose-li:text-zinc-300 prose-li:marker:text-rose-400/70",
        "prose-a:text-rose-300 hover:prose-a:text-rose-200",
        "prose-code:text-rose-200 prose-code:bg-zinc-900/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        "prose-blockquote:border-l-rose-500/50 prose-blockquote:text-zinc-200",
        "prose-img:rounded-lg prose-img:border prose-img:border-zinc-800",
        "prose-hr:border-zinc-800",
        className,
      )}
    >
      {children}
    </article>
  );
}
