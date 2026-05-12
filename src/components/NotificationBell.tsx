"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Heart, MessageSquare, Star, CornerDownRight } from "lucide-react";
import { markAllRead } from "@/app/actions/notifications";
import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
  notifications,
}: {
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

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
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors text-gray-600 hover:text-orange-500"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => startTransition(() => markAllRead())}
                disabled={isPending}
                className="text-xs text-orange-500 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Link
                  key={n.id}
                  href={n.plate_id ? `/plate/${n.plate_id}` : "/"}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors ${
                    !n.read ? "bg-orange-50/60" : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(n.actor?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">
                        {n.actor?.username ?? "Someone"}
                      </span>{" "}
                      {messages[n.type]}
                      {n.plate && (
                        <span className="font-medium text-orange-600">
                          {" "}"{n.plate.title}"
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
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
