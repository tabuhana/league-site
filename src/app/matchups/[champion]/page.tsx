export default async function MatchupPage({
  params,
}: {
  params: Promise<{ champion: string }>;
}) {
  const { champion } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Matchup vs {champion}</h1>
    </div>
  );
}
