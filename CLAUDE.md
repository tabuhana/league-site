# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint (flat config, `eslint.config.mjs`)
- `bunx shadcn add <component>` — add a shadcn/ui component

No test framework is configured.

## Architecture

Next.js 16 app (App Router) with React 19, Tailwind CSS v4, and the React Compiler enabled (`reactCompiler: true` in `next.config.ts`).

**Important:** Next.js 16 has breaking changes from earlier versions. Before writing routing, data-fetching, or config code, read the relevant guide in `node_modules/next/dist/docs/`.

### Key conventions

- **Path alias:** `@/*` maps to `./src/*`.
- **UI components:** `src/components/ui/` — shadcn/ui v4 components built on `@base-ui/react` primitives (not Radix). Use `cva` for variants and the `cn()` helper from `src/lib/utils.ts` for class merging.
- **Styling:** Tailwind v4 with CSS-first config in `src/app/globals.css`. Design tokens (colors, radii) are CSS custom properties using oklch. Dark mode via `.dark` class variant.
- **Fonts:** Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) loaded in the root layout.
- **Icons:** `lucide-react`.
