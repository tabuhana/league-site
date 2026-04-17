# Contributing Matchup Guides

Riven matchup guides live as MDX files in [`src/content/matchups/`](src/content/matchups/). Each file is rendered into a stats banner + prose page at `/matchups/[champion]`. This document covers the authoring workflow.

---

## 1. Create a new guide

1. Copy the template:
   ```bash
   cp src/content/matchups/_template.mdx src/content/matchups/<championKey>.mdx
   ```
2. Rename `<championKey>` to the **lowercase Data Dragon key** for the opponent (see the [File naming convention](#file-naming-convention) section below).
3. Open the new file and fill in the `metadata` export at the top:
   ```mdx
   export const metadata = {
     champion: "Darius",         // display name shown in headings
     championKey: "Darius",      // Data Dragon key (PascalCase, no spaces)
     difficulty: "hard",         // "easy" | "medium" | "hard"
     patch: "15.1",              // patch the guide targets
     author: "your-handle",
     lastUpdated: "2026-04-17",  // YYYY-MM-DD
     tldr: "One-sentence summary of the matchup.",
   };
   ```
4. Replace the placeholder copy under each section. Keep the existing section headings (`Overview`, `Laning Phase`, `Key Abilities to Watch`, `Itemization`, `Tips & Tricks`, `Gameplay Phases → Early/Mid/Late`) so guides stay scannable across the library. Adding extra `##` sections is fine.

That's it — the matchup automatically appears on `/matchups` and gets its own page at `/matchups/<championKey-lowercase>` on the next build.

---

## 2. File naming convention

- Filenames are **lowercase Data Dragon keys**, e.g. `darius.mdx`, `ksante.mdx`, `drmundo.mdx`.
- The slug must match `metadata.championKey.toLowerCase()`.
- Files starting with `_` (e.g. `_template.mdx`) are ignored by the loader.
- Extension is always `.mdx`.

Look up keys in [Data Dragon's `champion.json`](https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion.json) — they're the `key` field on each champion (not the numeric id, not the display name). Common gotchas:

| Display name | championKey | filename       |
| ------------ | ----------- | -------------- |
| Cho'Gath     | `Chogath`   | `chogath.mdx`  |
| Dr. Mundo    | `DrMundo`   | `drmundo.mdx`  |
| K'Sante      | `KSante`    | `ksante.mdx`   |
| Wukong       | `MonkeyKing`| `monkeyking.mdx` |

The champion must also be present in [`src/constants/champions.ts`](src/constants/champions.ts) so the icon and ID lookups work. Add it there if it's missing.

---

## 3. Adding images

1. Create a folder for the matchup under [`public/matchup-images/`](public/):
   ```
   public/matchup-images/<championKey-lowercase>/
   ```
2. Drop screenshots, diagrams, etc. inside.
3. Reference them with absolute paths from the public root:
   ```mdx
   ![Wave state at level 3](/matchup-images/darius/wave-level-3.png)
   ```
4. Prefer `.png` for diagrams/UI captures and `.jpg` for splash-style screenshots. Keep individual files under ~500 KB; downscale wide screenshots to ~1600 px.

Images render through the `prose-img` styles in [`GuideRenderer`](src/components/guide/GuideRenderer.tsx) — they get a rounded border and dark theme styling automatically.

---

## 4. Custom MDX components

These components are registered globally in [`mdx-components.tsx`](mdx-components.tsx), so you can use them inside any `.mdx` file with no imports.

### `<TipBlock />`

Callout box for actionable tips. Pick the right `type`:

```mdx
<TipBlock type="do">
  Cancel Q3 into E mid-animation to catch dodges.
</TipBlock>

<TipBlock type="dont">
  Don't all-in at 5 stacks of Hemorrhage — reset trades instead.
</TipBlock>

<TipBlock type="info">
  Darius passive bleeds for 5 stacks max; stalling 4+ seconds resets the decay.
</TipBlock>
```

| `type`   | Color  | Use for                                    |
| -------- | ------ | ------------------------------------------ |
| `"do"`   | Green  | Recommended actions / good plays            |
| `"dont"` | Red    | Anti-patterns / things that get you killed  |
| `"info"` | Blue   | Mechanics knowledge / cooldowns / breakpoints |

Children can be any markdown — paragraphs, lists, bold, code.

### `<DifficultyBadge />`

Pill badge for matchup difficulty. Already used in the auto-generated `# {champion} vs Riven` heading from the template, but you can place additional ones inline:

```mdx
This phase is much harder once they pick up Black Cleaver — <DifficultyBadge level="hard" />.
```

`level` must be `"easy"`, `"medium"`, or `"hard"`.

### `<AbilityIcon />`

Inline icon that pulls the ability sprite from Data Dragon. Useful for ability bullet lists:

```mdx
- <AbilityIcon champion="Darius" ability="Q" /> **Q (Decimate)** — outer blade damage, dodge it with E.
- <AbilityIcon champion="Darius" ability="R" size={24} /> **R (Noxian Guillotine)** — execute, never fight low.
```

Props:

- `champion` — the Data Dragon `championKey` (PascalCase). Inside a guide use `metadata.championKey` for the opposing champion.
- `ability` — `"P"` (passive), `"Q"`, `"W"`, `"E"`, or `"R"`.
- `size` — pixel size, defaults to `32`.

---

## 5. Preview locally

```bash
npm run dev
```

Then open:

- [http://localhost:3000/matchups](http://localhost:3000/matchups) — see your guide land in the grid.
- `http://localhost:3000/matchups/<championKey-lowercase>` — the individual page with stats banner.

Hot reload picks up MDX edits without restarting. If a new file doesn't show up, restart the dev server so the MDX dynamic-import context refreshes.

Before opening a PR, run a production build to catch metadata typos and missing components:

```bash
npm run build
```

---

## Quick checklist

- [ ] Filename is the lowercase Data Dragon key + `.mdx`.
- [ ] `metadata.championKey` matches the filename casing rules.
- [ ] `metadata.difficulty` is one of `"easy" | "medium" | "hard"`.
- [ ] All four `## Key Abilities to Watch` bullets use `<AbilityIcon />`.
- [ ] At least one `<TipBlock type="do">` and one `<TipBlock type="dont">`.
- [ ] Champion exists in `src/constants/champions.ts`.
- [ ] Images live under `public/matchup-images/<championKey-lowercase>/`.
- [ ] `npm run build` passes locally.
