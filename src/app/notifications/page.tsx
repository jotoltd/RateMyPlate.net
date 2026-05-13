import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, MessageSquare, Star, CornerDownRight, Users, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "@/app/actions/notifications";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Notifications – Rate My Plate" };

const icons: Record<string, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-rose-500 fill-rose-400" />,
  comment: <MessageSquare className="w-4 h-4 text-blue-500" />,
  rating: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />,
  reply: <CornerDownRight className="w-4 h-4 text-orange-500" />,
  follow: <Users className="w-4 h-4 text-violet-500" />,
};

const messages: Record<string, string> = {
  like: "liked your plate",
  comment: "commented on your plate",
  rating: "rated your plate",
  reply: "replied to your comment",
  follow: "started following you",
};

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
          {notifs.map((n) => {
            const actor = n.actor as { id: string; username: string; avatar_url?: string } | null;
            const plate = n.plate as { id: string; title: string; image_url: string } | null;
            return (
              <Link
                key={n.id}
                href={plate ? `/plate/${plate.id}` : actor ? `/profile/${actor.id}` : "/"}
                className={`flex items-start gap-4 p-4 rounded-3xl border transition-all hover:border-orange-500/30 ${
                  !n.read
                    ? "bg-orange-500/5 border-orange-500/20 border-l-2 border-l-orange-500"
                    : "bg-surface-1 border-app-1"
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-nav rounded-full flex items-center justify-center">
                    {icons[n.type] ?? <Bell className="w-3 h-3 text-gray-400" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-app">
                    <span className="font-bold">{actor?.username ?? "Someone"}</span>{" "}
                    {messages[n.type] ?? "interacted with you"}
                    {plate && (
                      <span className="font-semibold text-orange-500"> "{plate.title}"</span>
                    )}
                  </p>
                  <p className="text-xs text-faint mt-0.5">{formatDate(n.created_at)}</p>
                </div>

                {/* Plate thumbnail */}
                {plate && (
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
                    <img src={plate.image_url} alt={plate.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {!n.read && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
