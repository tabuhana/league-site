import {
  formatGameDuration,
  formatKDA,
  formatTimeAgo,
  calculateKDARatio,
  cn,
} from "@/lib/utils";
import { MatchupLink } from "./MatchupLink";
import { getChampionByName } from "@/constants/champions";
import {
  getChampionIconUrl,
  getItemIconUrl,
} from "@/lib/riot/ddragon";
import type { RivenGame } from "@/lib/db/schema";
import { RANKED_SOLO, RANKED_FLEX, NORMAL_DRAFT } from "@/constants/riven";

const QUEUE_LABELS: Record<number, string> = {
  [RANKED_SOLO]: "Ranked Solo",
  [RANKED_FLEX]: "Ranked Flex",
  [NORMAL_DRAFT]: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
};

function parseItems(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function RivenMatchCardView({
  game,
  opponentIcon,
  itemIcons,
  trinketIcon,
  opponentKey,
  queueLabel,
  expanded,
  children,
}: {
  game: RivenGame;
  opponentIcon: string;
  itemIcons: (string | null)[];
  trinketIcon: string | null;
  opponentKey: string;
  queueLabel: string;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  const win = game.win === 1;
  const csDiff = game.cs - game.opponentCs;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-md border-l-4 bg-bg-secondary transition-colors",
        win
          ? "border-accent-green/70 hover:bg-accent-green/5"
          : "border-accent-red/70 hover:bg-accent-red/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <div className="min-w-[90px]">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              win ? "text-accent-green" : "text-accent-red",
            )}
          >
            {win ? "Victory" : "Defeat"}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
            {queueLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-text-secondary">
            {formatGameDuration(game.gameDuration)}
          </p>
          <p className="mt-0.5 text-[10px] text-text-secondary">
            {formatTimeAgo(game.gameCreation)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <p className="font-mono text-lg font-semibold tabular-nums text-text-primary">
              {formatKDA(game.kills, game.deaths, game.assists)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">
              {calculateKDARatio(game.kills, game.deaths, game.assists)} KDA
            </p>
          </div>
          <div className="h-10 w-px bg-riven-border" />
          <div>
            <p className="font-mono text-sm tabular-nums text-text-primary">
              {game.cs} CS
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">
              {game.csPer10.toFixed(1)}/10
            </p>
          </div>
          <div className="h-10 w-px bg-riven-border" />
          <div>
            <p
              className={cn(
                "font-mono text-sm tabular-nums",
                csDiff > 0
                  ? "text-accent-green"
                  : csDiff < 0
                    ? "text-accent-red"
                    : "text-text-secondary",
              )}
            >
              {csDiff > 0 ? "+" : ""}
              {csDiff} CS
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">
              vs lane
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {itemIcons.map((icon, idx) =>
            icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={icon}
                alt=""
                className="size-7 rounded bg-bg-tertiary"
              />
            ) : (
              <div
                key={idx}
                className="size-7 rounded bg-bg-tertiary ring-1 ring-riven-border/50"
              />
            ),
          )}
          {trinketIcon ? (
            <>
              <div className="mx-1 h-7 w-px bg-riven-border" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trinketIcon}
                alt=""
                className="size-7 rounded bg-bg-tertiary"
              />
            </>
          ) : null}
        </div>

        <MatchupLink
          opponentKey={opponentKey}
          opponentIcon={opponentIcon}
          opponentName={game.opponentChampionName}
        />
      </div>

      {expanded ? children : null}
    </article>
  );
}

export async function RivenMatchCard({
  game,
  expanded,
  children,
}: {
  game: RivenGame;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  const items = parseItems(game.items);
  const opponentChamp = getChampionByName(game.opponentChampionName);
  const opponentKey = opponentChamp?.key ?? game.opponentChampionName;
  const opponentIcon = await getChampionIconUrl(opponentKey);
  const itemIcons = await Promise.all(
    items.slice(0, 6).map((id) =>
      id > 0 ? getItemIconUrl(id) : Promise.resolve(null),
    ),
  );
  const trinketIcon =
    items[6] && items[6] > 0 ? await getItemIconUrl(items[6]) : null;

  const queueLabel = QUEUE_LABELS[game.queueId] ?? "Custom";

  return (
    <RivenMatchCardView
      game={game}
      opponentIcon={opponentIcon}
      itemIcons={itemIcons}
      trinketIcon={trinketIcon}
      opponentKey={opponentKey}
      queueLabel={queueLabel}
      expanded={expanded}
    >
      {children}
    </RivenMatchCardView>
  );
}
