import { enrichMatchDetailFromSnapshot } from "@/lib/match-detail-enrichment";
import { MatchDetailView } from "./MatchDetailView";

export { MatchDetailView } from "./MatchDetailView";
export type {
  SnapshotParticipant,
  MatchDetailRow,
  EnrichedTeam,
  MatchDetailPayload,
} from "@/lib/match-detail-enrichment";
export { enrichMatchDetailFromSnapshot } from "@/lib/match-detail-enrichment";

export async function MatchDetail({
  matchSnapshot,
  rivenPuuid,
  opponentChampionId,
}: {
  matchSnapshot: string;
  rivenPuuid: string;
  opponentChampionId: number;
}) {
  const payload = await enrichMatchDetailFromSnapshot(matchSnapshot);
  if (!payload) {
    return (
      <div className="border-t border-riven-border bg-bg-tertiary/40 p-4 text-sm text-text-secondary">
        No match details available.
      </div>
    );
  }

  return (
    <MatchDetailView
      enrichedTeams={payload.enrichedTeams}
      maxDamage={payload.maxDamage}
      rivenPuuid={rivenPuuid}
      opponentChampionId={opponentChampionId}
    />
  );
}
