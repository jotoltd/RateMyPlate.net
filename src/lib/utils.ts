import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getStarLabel(rating: number) {
  if (rating >= 4.5) return "Exceptional ✨";
  if (rating >= 3.5) return "Great 🔥";
  if (rating >= 2.5) return "Good 👍";
  if (rating >= 1.5) return "Okay 😐";
  return "Poor 😬";
}

/** Convert a stored 1-10 score to 1-5 display stars */
export function scoreToStars(score: number): number {
  return Math.round((score / 10) * 5 * 2) / 2; // half-star precision
}

/** Convert a 1-5 star pick back to 1-10 for storage */
export function starsToScore(stars: number): number {
  return Math.round((stars / 5) * 10);
}
