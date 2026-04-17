export default async function PlayerPage({
  params,
}: {
  params: Promise<{ region: string; riotId: string }>;
}) {
  const { region, riotId } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">
        {decodeURIComponent(riotId)} ({region})
      </h1>
    </div>
  );
}
