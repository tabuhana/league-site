import { getAbilityIconUrl } from "@/lib/riot/ddragon";

type Ability = "P" | "Q" | "W" | "E" | "R";

export async function AbilityIcon({
  champion,
  ability,
  size = 32,
}: {
  champion: string;
  ability: Ability;
  size?: number;
}) {
  const src = await getAbilityIconUrl(champion, ability);
  return (
    <img
      src={src}
      alt={`${champion} ${ability}`}
      width={size}
      height={size}
      loading="lazy"
      className="inline-block rounded align-middle"
    />
  );
}
