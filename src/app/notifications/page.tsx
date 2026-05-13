import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "@/app/actions/notifications";
import NotificationItem from "./NotificationItem";

export const metadata = { title: "Notifications – Rate My Plate" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, actor:actor_id(id, username, avatar_url), plate:plate_id(id, title, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifs = notifications ?? [];
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-md relative">
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-app">Notifications</h1>
            <p className="text-sm text-muted">{unread > 0 ? `${unread} unread` : "All caught up!"}</p>
          </div>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-orange-500/10 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20 text-faint">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">When someone likes, rates or comments — it shows up here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              read={n.read}
              type={n.type}
              created_at={n.created_at}
              actor={n.actor as { id: string; username: string; avatar_url?: string } | null}
              plate={n.plate as { id: string; title: string; image_url: string } | null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
