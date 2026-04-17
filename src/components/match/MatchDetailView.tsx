import { formatKDA, cn } from "@/lib/utils";
import type {
  MatchDetailPayload,
  MatchDetailRow,
} from "@/lib/match-detail-enrichment";

export function MatchDetailView({
  enrichedTeams,
  maxDamage,
  rivenPuuid,
  opponentChampionId,
}: MatchDetailPayload & {
  rivenPuuid: string;
  opponentChampionId: number;
}) {
  return (
    <div className="border-t border-riven-border bg-bg-primary/60 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {enrichedTeams.map(({ teamId, rows }) => (
          <TeamColumn
            key={teamId}
            teamId={teamId}
            rows={rows}
            rivenPuuid={rivenPuuid}
            opponentChampionId={opponentChampionId}
            maxDamage={maxDamage}
          />
        ))}
      </div>
    </div>
  );
}

function TeamColumn({
  teamId,
  rows,
  rivenPuuid,
  opponentChampionId,
  maxDamage,
}: {
  teamId: number;
  rows: MatchDetailRow[];
  rivenPuuid: string;
  opponentChampionId: number;
  maxDamage: number;
}) {
  const win = rows[0]?.p.win ?? false;
  const colorLabel = teamId === 100 ? "Blue" : "Red";
  const colorBar = teamId === 100 ? "bg-accent-blue" : "bg-accent-red";

  return (
    <div className="rounded-md border border-riven-border bg-bg-secondary/60">
      <div
        className={cn(
          "flex items-center justify-between border-b border-riven-border px-3 py-2 text-xs uppercase tracking-widest",
          win ? "text-accent-green" : "text-accent-red",
        )}
      >
        <span>
          {colorLabel} Team · {win ? "Victory" : "Defeat"}
        </span>
      </div>
      <div className="divide-y divide-riven-border/60">
        {rows.map(({ p, iconUrl, items }) => {
          const isRiven = p.puuid === rivenPuuid;
          const isOpponent =
            p.championId === opponentChampionId && !isRiven;
          const damagePct = (p.damage / maxDamage) * 100;

          return (
            <div
              key={p.puuid}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs",
                isRiven && "bg-accent-gold/10",
                isOpponent && "bg-accent-red/10",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconUrl}
                alt=""
                className="size-8 shrink-0 rounded"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">
                  {p.championName}
                </p>
                <p className="font-mono tabular-nums text-text-secondary">
                  {formatKDA(p.kills, p.deaths, p.assists)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-mono tabular-nums text-text-primary">
                  {p.cs}
                </p>
                <p className="text-[10px] uppercase text-text-secondary">CS</p>
              </div>
              <div className="w-20">
                <div className="relative h-3 overflow-hidden rounded bg-bg-tertiary">
                  <div
                    className={cn("absolute inset-y-0 left-0", colorBar)}
                    style={{ width: `${damagePct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right font-mono text-[10px] tabular-nums text-text-secondary">
                  {p.damage.toLocaleString()}
                </p>
              </div>
              <div className="hidden items-center gap-0.5 md:flex">
                {items.slice(0, 6).map((icon, idx) =>
                  icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={icon}
                      alt=""
                      className="size-5 rounded"
                    />
                  ) : (
                    <div
                      key={idx}
                      className="size-5 rounded bg-bg-tertiary"
                    />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
