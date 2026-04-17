import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKDA(kills: number, deaths: number, assists: number): string {
  return `${kills}/${deaths}/${assists}`;
}

export function calculateKDARatio(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / deaths) * 100) / 100;
}

export function formatWinRate(wins: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export function formatTimeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  if (diff < 0) return "just now";

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return seconds <= 1 ? "just now" : `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function formatGameDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const TIER_COLORS: Record<string, string> = {
  IRON: "#5d5d5d",
  BRONZE: "#a0724a",
  SILVER: "#9aa0a6",
  GOLD: "#d4af37",
  PLATINUM: "#3eb8a8",
  EMERALD: "#3ec76e",
  DIAMOND: "#5c9fd6",
  MASTER: "#b567d6",
  GRANDMASTER: "#c73e3e",
  CHALLENGER: "#f0c24a",
  UNRANKED: "#8b8b9e",
};

export function getTierColor(tier: string | null | undefined): string {
  if (!tier) return TIER_COLORS.UNRANKED;
  return TIER_COLORS[tier.toUpperCase()] ?? TIER_COLORS.UNRANKED;
}

export function parseRiotId(urlParam: string): { gameName: string; tagLine: string } {
  const decoded = decodeURIComponent(urlParam);
  const lastDash = decoded.lastIndexOf("-");
  if (lastDash === -1) {
    return { gameName: decoded, tagLine: "" };
  }
  return {
    gameName: decoded.slice(0, lastDash),
    tagLine: decoded.slice(lastDash + 1),
  };
}
