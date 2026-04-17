export type Champion = {
  name: string;
  key: string;
};

export const CHAMPIONS: Record<number, Champion> = {
  6: { name: "Urgot", key: "Urgot" },
  17: { name: "Teemo", key: "Teemo" },
  23: { name: "Tryndamere", key: "Tryndamere" },
  24: { name: "Jax", key: "Jax" },
  27: { name: "Singed", key: "Singed" },
  31: { name: "Cho'Gath", key: "Chogath" },
  36: { name: "Dr. Mundo", key: "DrMundo" },
  39: { name: "Irelia", key: "Irelia" },
  41: { name: "Gangplank", key: "Gangplank" },
  54: { name: "Malphite", key: "Malphite" },
  58: { name: "Renekton", key: "Renekton" },
  67: { name: "Vayne", key: "Vayne" },
  68: { name: "Rumble", key: "Rumble" },
  75: { name: "Nasus", key: "Nasus" },
  78: { name: "Poppy", key: "Poppy" },
  79: { name: "Gragas", key: "Gragas" },
  82: { name: "Mordekaiser", key: "Mordekaiser" },
  83: { name: "Yorick", key: "Yorick" },
  85: { name: "Kennen", key: "Kennen" },
  86: { name: "Garen", key: "Garen" },
  92: { name: "Riven", key: "Riven" },
  106: { name: "Volibear", key: "Volibear" },
  114: { name: "Fiora", key: "Fiora" },
  122: { name: "Darius", key: "Darius" },
  126: { name: "Jayce", key: "Jayce" },
  133: { name: "Quinn", key: "Quinn" },
  164: { name: "Camille", key: "Camille" },
  240: { name: "Kled", key: "Kled" },
  266: { name: "Aatrox", key: "Aatrox" },
  420: { name: "Illaoi", key: "Illaoi" },
  516: { name: "Ornn", key: "Ornn" },
  799: { name: "Ambessa", key: "Ambessa" },
  875: { name: "Sett", key: "Sett" },
  897: { name: "K'Sante", key: "KSante" },
};

export function getChampionById(id: number): Champion | undefined {
  return CHAMPIONS[id];
}

export function getChampionByName(name: string): Champion | undefined {
  const needle = name.toLowerCase();
  for (const champ of Object.values(CHAMPIONS)) {
    if (champ.name.toLowerCase() === needle || champ.key.toLowerCase() === needle) {
      return champ;
    }
  }
  return undefined;
}
