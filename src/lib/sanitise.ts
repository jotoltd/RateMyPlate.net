/**
 * Strip HTML tags and null-bytes to prevent XSS.
 * Server-side only — no external deps required.
 */
export function sanitise(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/\0/g, "")             // strip null bytes
    .replace(/javascript:/gi, "")   // strip JS proto
    .trim();
}
