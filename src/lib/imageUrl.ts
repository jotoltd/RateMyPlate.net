/**
 * Append Supabase image transform params to a public storage URL.
 * Falls back to original URL if not a Supabase storage URL.
 */
export function imgUrl(
  url: string,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return url;
  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/public/")) return url;

  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}
