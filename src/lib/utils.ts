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
  if (rating >= 9) return "Exceptional";
  if (rating >= 7) return "Great";
  if (rating >= 5) return "Good";
  if (rating >= 3) return "Okay";
  return "Poor";
}
