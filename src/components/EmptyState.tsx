import Link from "next/link";
import { ImageIcon, Users, Heart, Search, Bell, UtensilsCrossed } from "lucide-react";

interface EmptyStateProps {
  type: "plates" | "following" | "liked" | "saved" | "notifications" | "search" | "collections";
  action?: { href: string; label: string };
}

const config = {
  plates: {
    icon: ImageIcon,
    title: "No plates yet",
    description: "Be the first to share your culinary creations!",
    emoji: "🍽️",
  },
  following: {
    icon: Users,
    title: "No plates from chefs you follow",
    description: "Follow more chefs to see their latest plates here.",
    emoji: "👨‍🍳",
  },
  liked: {
    icon: Heart,
    title: "No liked plates yet",
    description: "Double-tap plates you love to save them here.",
    emoji: "❤️",
  },
  saved: {
    icon: ImageIcon,
    title: "No saved plates",
    description: "Save plates to your collections for quick access.",
    emoji: "🔖",
  },
  notifications: {
    icon: Bell,
    title: "No notifications",
    description: "When someone interacts with your plates, you'll see it here.",
    emoji: "🔔",
  },
  search: {
    icon: Search,
    title: "No results",
    description: "Try different keywords or check your spelling.",
    emoji: "🔍",
  },
  collections: {
    icon: UtensilsCrossed,
    title: "No collections yet",
    description: "Create collections to organize your favorite plates.",
    emoji: "📁",
  },
};

export function EmptyState({ type, action }: EmptyStateProps) {
  const { icon: Icon, title, description, emoji } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/20 flex items-center justify-center mb-6 shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent animate-pulse" />
        <span className="text-4xl relative z-10 animate-bounce" style={{ animationDuration: '3s' }}>{emoji}</span>
      </div>
      <h3 className="text-xl font-black text-app mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-8 leading-relaxed">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all press-scale shadow-lg shadow-orange-500/25"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function LoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-1 border border-app-1 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-2" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 bg-surface-2 rounded-lg" />
              <div className="h-3 w-16 bg-surface-2 rounded-lg" />
            </div>
          </div>
          <div className="px-4 pb-3 space-y-1.5">
            <div className="h-4 w-3/4 bg-surface-2 rounded-lg" />
            <div className="h-3 w-1/2 bg-surface-2 rounded-lg" />
          </div>
          <div className="w-full bg-surface-2" style={{ aspectRatio: "4/3" }} />
          <div className="flex gap-4 px-4 py-3 border-t border-app-1">
            <div className="h-3.5 w-12 bg-surface-2 rounded-lg" />
            <div className="h-3.5 w-16 bg-surface-2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
