"use client";

import { useTransition } from "react";
import { adminBanUser, adminUnbanUser, adminDeleteUser, adminToggleAdmin } from "@/app/actions/admin";
import { Ban, CheckCircle, Trash2, Shield, ShieldOff } from "lucide-react";

export default function AdminUserActions({
  userId,
  isBanned,
  isAdmin,
}: {
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => { await action(); });
  }

  return (
    <div className="flex items-center gap-1">
      {isBanned ? (
        <button
          onClick={() => run(() => adminUnbanUser(userId))}
          disabled={isPending}
          title="Unban"
          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => run(() => adminBanUser(userId))}
          disabled={isPending}
          title="Ban"
          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
        >
          <Ban className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => run(() => adminToggleAdmin(userId, !isAdmin))}
        disabled={isPending}
        title={isAdmin ? "Remove admin" : "Make admin"}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
          isAdmin ? "text-violet-400 hover:bg-violet-500/10" : "text-faint hover:bg-surface-2"
        }`}
      >
        {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      </button>

      <button
        onClick={() => {
          if (!confirm("Delete this user and all their content? This cannot be undone.")) return;
          run(() => adminDeleteUser(userId));
        }}
        disabled={isPending}
        title="Delete user"
        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
