"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Award, X, Check, User } from "lucide-react";
import { awardBadge } from "./actions";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  color: string;
  category: string;
}

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
  reason: string | null;
  badges: Badge;
}

export function AwardBadges({
  badges,
  searchResults,
  userBadges,
  initialQuery,
}: {
  badges: Badge[];
  searchResults: UserResult[] | null;
  userBadges: Record<string, UserBadge[]>;
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/badges?user=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleAward = async () => {
    if (!selectedUser || !selectedBadge) return;
    setIsLoading(true);
    try {
      const result = await awardBadge({
        userId: selectedUser.id,
        badgeId: selectedBadge,
        reason: reason || undefined,
      });
      if (result.success) {
        setSelectedBadge("");
        setReason("");
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (userBadgeId: string) => {
    // Remove badge implementation would go here
    router.refresh();
  };

  const hasBadge = (userId: string, badgeId: string) => {
    return (userBadges[userId] ?? []).some((ub) => ub.badge_id === badgeId);
  };

  return (
    <div className="space-y-4">
      {/* Search users */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by username..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-app-1 rounded-xl text-app placeholder:text-faint text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Search
        </button>
      </form>

      {/* Search results */}
      {searchResults && (
        <div className="border border-app-1 rounded-xl overflow-hidden divide-y divide-app-1">
          {searchResults.length === 0 ? (
            <p className="p-4 text-sm text-faint text-center">No users found</p>
          ) : (
            searchResults.map((user) => (
              <div
                key={user.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? "bg-orange-500/10" : "bg-surface-2/50 hover:bg-surface-2"
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-faint" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-app">@{user.username}</p>
                    <p className="text-xs text-faint">
                      {user.is_admin && <span className="text-orange-400 mr-2">Admin</span>}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check className="w-4 h-4 text-orange-400" />
                  )}
                </div>

                {/* User's current badges */}
                {userBadges[user.id]?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
                    {userBadges[user.id].map((ub) => (
                      <span
                        key={ub.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full"
                        style={{ backgroundColor: `${ub.badges.color}20`, color: ub.badges.color }}
                      >
                        {ub.badges.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(ub.id);
                          }}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Award badge form */}
      {selectedUser && (
        <div className="bg-surface-2 border border-app-1 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-app">
            Award badge to <span className="text-orange-400">@{selectedUser.username}</span>:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.map((badge) => {
              const alreadyHas = hasBadge(selectedUser.id, badge.id);
              return (
                <button
                  key={badge.id}
                  onClick={() => !alreadyHas && setSelectedBadge(badge.id)}
                  disabled={alreadyHas}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    alreadyHas
                      ? "border-app-1 opacity-50 cursor-not-allowed"
                      : selectedBadge === badge.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-app-1 hover:border-orange-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: badge.color }}
                    >
                      <Award className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-app">{badge.name}</span>
                  </div>
                  <p className="text-[10px] text-faint mt-1 truncate">{badge.description}</p>
                  {alreadyHas && (
                    <p className="text-[10px] text-orange-400 mt-1">Already has</p>
                  )}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for awarding (optional)"
            className="w-full px-3 py-2 bg-surface-1 border border-app-1 rounded-lg text-sm text-app placeholder:text-faint"
          />
          <button
            onClick={handleAward}
            disabled={!selectedBadge || isLoading}
            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-surface-2 disabled:text-faint text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isLoading ? "Awarding..." : "Award Badge"}
          </button>
        </div>
      )}
    </div>
  );
}
