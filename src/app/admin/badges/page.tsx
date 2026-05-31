/* eslint-disable react/no-unescaped-entities */
import { requireAdmin } from "@/lib/admin";
import { AwardBadges } from "./AwardBadges";
import { BadgeList } from "./BadgeList";
import { Award, Users, Shield, Star } from "lucide-react";

export const metadata = { title: "Badges & Verification – Admin" };

export default async function BadgesPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const { supabase } = await requireAdmin();
  const userQuery = searchParams.user?.trim() ?? "";

  // Get all badges
  const { data: badges } = await supabase
    .from("badges")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true });

  // Get badge counts (fetch all and count in code since Supabase doesn't have group_by)
  const { data: allUserBadges } = await supabase.from("user_badges").select("badge_id");
  const badgeCounts = (allUserBadges ?? []).reduce((acc, ub) => {
    acc[ub.badge_id] = (acc[ub.badge_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Search users if query provided
  let searchResults = null;
  if (userQuery.length >= 2) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_admin, created_at")
      .ilike("username", `%${userQuery}%`)
      .limit(10);
    searchResults = data;
  }

  // Get user badges for searched users
  const userBadges: Record<string, any[]> = {};
  if (searchResults) {
    for (const user of searchResults) {
      const { data } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge_id,
          awarded_at,
          reason,
          badges (id, name, description, icon_url, color, category)
        `)
        .eq("user_id", user.id);
      userBadges[user.id] = data ?? [];
    }
  }

  // Stats
  const { count: totalBadges } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true });
  
  const { count: verifiedUsers } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("badge_id", badges?.find((b) => b.name === "Verified Chef")?.id ?? "");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-app">Badges & Verification</h2>
          <p className="text-sm text-faint mt-1">Manage user badges and verification status</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-2xl font-black text-app">{totalBadges ?? 0}</p>
            <p className="text-xs text-faint">total badges awarded</p>
          </div>
          <div>
            <p className="text-2xl font-black text-app">{verifiedUsers ?? 0}</p>
            <p className="text-xs text-faint">verified chefs</p>
          </div>
        </div>
      </div>

      {/* Award badges section */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-app mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-400" />
          Award Badges to Users
        </h3>
        <AwardBadges 
          badges={badges ?? []} 
          searchResults={searchResults} 
          userBadges={userBadges}
          initialQuery={userQuery}
        />
      </div>

      {/* Badge list */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-app-1">
          <h3 className="text-sm font-bold text-app flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            Available Badges
          </h3>
        </div>
        <BadgeList badges={badges ?? []} badgeCounts={badgeCounts ?? []} />
      </div>
    </div>
  );
}
