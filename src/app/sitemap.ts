import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = "https://ratemyplate.net";

  const [{ data: plates }, { data: profiles }] = await Promise.all([
    supabase.from("plates").select("id, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, created_at").limit(500),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  const plateRoutes: MetadataRoute.Sitemap = (plates ?? []).map((p) => ({
    url: `${baseUrl}/plate/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${baseUrl}/profile/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...plateRoutes, ...profileRoutes];
}
