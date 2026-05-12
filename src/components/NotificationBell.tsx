"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Heart, MessageSquare, Star, CornerDownRight } from "lucide-react";
import { markAllRead } from "@/app/actions/notifications";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const icons: Record<string, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-rose-500" />,
  comment: <MessageSquare className="w-4 h-4 text-blue-500" />,
  rating: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />,
  reply: <CornerDownRight className="w-4 h-4 text-orange-500" />,
  follow: <Bell className="w-4 h-4 text-violet-500" />,
};

const messages: Record<string, string> = {
  like: "liked your plate",
  comment: "commented on your plate",
  rating: "rated your plate",
  reply: "replied to your comment",
  follow: "started following you",
};

export default function NotificationBell({
  notifications: initial,
  userId,
}: {
  notifications: Notification[];
  userId?: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initial);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  // Realtime: prepend new notifications instantly
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let active = true;

    async function handleInsert(payload: { new: { id: string } }) {
      if (!active) return;
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(id, username), plate:plate_id(id, title, image_url)")
        .eq("id", payload.new.id)
        .single();
      if (active && data) setNotifications((prev) => [data as Notification, ...prev]);
    }

    // Build and subscribe in one chain — .on() must come before .subscribe()
    const channel = supabase
      .channel(`notif-bell-${userId}`)
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        handleInsert
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      startTransition(() => markAllRead());
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-orange-500/10 transition-colors text-white/40 hover:text-orange-400"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#141414] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-bold text-white text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => { startTransition(() => markAllRead()); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }}
                disabled={isPending}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Link
                  key={n.id}
                  href={n.plate_id ? `/plate/${n.plate_id}` : "/"}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                    !n.read ? "bg-orange-500/5 border-l-2 border-orange-500" : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(n.actor?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white">
                        {n.actor?.username ?? "Someone"}
                      </span>{" "}
                      {messages[n.type]}
                      {n.plate && (
                        <span className="font-medium text-orange-400">
                          {" "}"{n.plate.title}"
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 mt-0.5">{icons[n.type]}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
