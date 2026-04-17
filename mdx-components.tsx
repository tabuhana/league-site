import type { MDXComponents } from "mdx/types";
import { AbilityIcon } from "@/components/guide/AbilityIcon";
import { DifficultyBadge } from "@/components/guide/DifficultyBadge";
import { TipBlock } from "@/components/guide/TipBlock";

const components: MDXComponents = {
  TipBlock,
  DifficultyBadge,
  AbilityIcon,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
