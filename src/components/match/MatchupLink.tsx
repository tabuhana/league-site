"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

export function MatchupLink({
  opponentKey,
  opponentIcon,
  opponentName,
}: {
  opponentKey: string;
  opponentIcon: string;
  opponentName: string;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
  }

  return (
    <Link
      href={`/matchups/${opponentKey.toLowerCase()}`}
      onClick={handleClick}
      className="ml-auto flex items-center gap-2 rounded px-2 py-1 hover:bg-bg-tertiary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={opponentIcon}
        alt={opponentName}
        className="size-10 rounded"
      />
      <div className="text-right">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          vs
        </p>
        <p className="text-sm font-semibold text-text-primary">
          {opponentName}
        </p>
      </div>
    </Link>
  );
}
