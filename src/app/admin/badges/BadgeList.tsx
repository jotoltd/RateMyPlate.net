"use client";

import { Award, Users } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  color: string;
  category: string;
  requirement_type: string | null;
  requirement_value: number | null;
}

export function BadgeList({
  badges,
  badgeCounts,
}: {
  badges: Badge[];
  badgeCounts: Record<string, number>;
}) {
  const getCount = (badgeId: string) => badgeCounts[badgeId] ?? 0;

  const categories = [...new Set(badges.map((b) => b.category))];

  return (
    <div className="divide-y divide-app-1">
      {categories.map((category) => (
        <div key={category}>
          <div className="px-5 py-2 bg-surface-2/50">
            <p className="text-xs font-bold text-faint uppercase tracking-wider">{category}</p>
          </div>
          <div className="divide-y divide-app-1">
            {badges
              .filter((b) => b.category === category)
              .map((badge) => (
                <div key={badge.id} className="px-5 py-3 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: badge.color }}
                  >
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app">{badge.name}</p>
                    <p className="text-xs text-faint">{badge.description}</p>
                    {badge.requirement_type && (
                      <p className="text-xs text-orange-400 mt-1">
                        Auto-award: {badge.requirement_type} = {badge.requirement_value}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-faint">
                      <Users className="w-3 h-3" />
                      {getCount(badge.id)} awarded
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {badges.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-faint">No badges configured yet</p>
        </div>
      )}
    </div>
  );
}
