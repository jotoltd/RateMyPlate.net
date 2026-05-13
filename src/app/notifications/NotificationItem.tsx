"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markRead } from "@/app/actions/notifications";
import { formatDate } from "@/lib/utils";

const icons: Record<string, string> = {
  like: "❤️",
  comment: "💬",
  rating: "⭐",
  reply: "↩️",
  follow: "👤",
};

const messages: Record<string, string> = {
  like: "liked your plate",
  comment: "commented on your plate",
  rating: "rated your plate",
  reply: "replied to your comment",
  follow: "started following you",
};

type NotifItemProps = {
  id: string;
  read: boolean;
  type: string;
  created_at: string;
  actor: { id: string; username: string; avatar_url?: string } | null;
  plate: { id: string; title: string; image_url: string } | null;
};

export default function NotificationItem({ id, read, type, created_at, actor, plate }: NotifItemProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (!read) await markRead(id);
      const href = plate ? `/plate/${plate.id}` : actor ? `/profile/${actor.id}` : "/";
      router.push(href);
    });
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-4 p-4 rounded-3xl border transition-all hover:border-orange-500/30 cursor-pointer ${
        !read
          ? "bg-orange-500/5 border-orange-500/20 border-l-[3px] border-l-orange-500"
          : "bg-surface-1 border-app-1 hover:bg-surface-2"
      }`}
    >
      {/* Avatar */}
      <div className="relative w-11 h-11 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-md">
        {actor?.avatar_url ? (
          <img src={actor.avatar_url} alt={actor.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white font-bold text-base">
              {(actor?.username ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-nav rounded-full flex items-center justify-center text-[11px]">
          {icons[type] ?? <Bell className="w-3 h-3 text-gray-400" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-app">
          <span className="font-bold">{actor?.username ?? "Someone"}</span>{" "}
          {messages[type] ?? "interacted with you"}
          {plate && (
            <span className="font-semibold text-orange-500"> &ldquo;{plate.title}&rdquo;</span>
          )}
        </p>
        <p className="text-xs text-faint mt-0.5">{formatDate(created_at)}</p>
      </div>

      {/* Plate thumbnail */}
      {plate && (
        <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
          <img src={plate.image_url} alt={plate.title} className="w-full h-full object-cover" />
        </div>
      )}

      {!read && (
        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2.5" />
      )}
    </button>
  );
}
