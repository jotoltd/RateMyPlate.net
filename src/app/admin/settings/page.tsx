import { requireAdmin } from "@/lib/admin";
import { saveSettings } from "@/app/actions/settings";
import { BarChart3, Megaphone, Save, Mail, Send } from "lucide-react";
import BroadcastButton from "../BroadcastButton";
import { triggerWeeklyDigest } from "@/app/actions/broadcast";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: settings }, { count: userCount }] = await Promise.all([
    supabase.from("app_settings").select("analytics_id, site_announcement").eq("id", true).single(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Analytics */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-app">Analytics</h2>
        </div>
        <form action={saveSettings} className="p-6 space-y-4">
          <input type="hidden" name="site_announcement" value={settings?.site_announcement ?? ""} />
          <div>
            <label className="block text-sm font-semibold text-app mb-2">Google Analytics Measurement ID</label>
            <input
              name="analytics_id"
              defaultValue={settings?.analytics_id ?? ""}
              placeholder="G-XXXXXXXXXX"
              className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-3 text-app text-sm font-mono focus:outline-none focus:border-orange-500/60 transition-colors"
            />
            <p className="text-xs text-faint mt-2">Updates take effect on next page load. Leave blank to disable analytics.</p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" /> Save Analytics
          </button>
        </form>
      </div>

      {/* Site Announcement Banner */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-orange-400" />
          <h2 className="font-bold text-app">Announcement Banner</h2>
        </div>
        <form action={saveSettings} className="p-6 space-y-4">
          <input type="hidden" name="analytics_id" value={settings?.analytics_id ?? ""} />
          <div>
            <label className="block text-sm font-semibold text-app mb-2">Banner message</label>
            <input
              name="site_announcement"
              defaultValue={settings?.site_announcement ?? ""}
              placeholder="e.g. 🎉 We just launched! Welcome to Rate My Plate."
              className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-3 text-app text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
            />
            <p className="text-xs text-faint mt-2">Shown as a banner at the top of the site for all users. Leave blank to hide.</p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" /> Save Banner
          </button>
        </form>
      </div>

      {/* Email — Weekly Digest */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" />
          <h2 className="font-bold text-app">Email</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-app">Weekly Digest</p>
              <p className="text-xs text-faint mt-0.5">
                Send a &quot;your week on Rate My Plate&quot; email to all {userCount ?? 0} users now.
              </p>
            </div>
            <BroadcastButton
              action={triggerWeeklyDigest}
              label="Send Digest Now"
              confirmText="Send to all users"
              colorClass="bg-violet-600 hover:bg-violet-500"
              count={userCount ?? 0}
            />
          </div>
          <p className="text-xs text-faint border-t border-app-1 pt-4">
            <Send className="w-3 h-3 inline mr-1" />
            For automated weekly sends, set up a cron job hitting{" "}
            <code className="bg-surface-2 px-1.5 py-0.5 rounded text-orange-400">/api/cron/weekly-digest</code>{" "}
            with header <code className="bg-surface-2 px-1.5 py-0.5 rounded text-orange-400">x-cron-secret</code> every Monday.
          </p>
        </div>
      </div>
    </div>
  );
}
