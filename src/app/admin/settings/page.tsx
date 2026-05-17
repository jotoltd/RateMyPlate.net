import { requireAdmin } from "@/lib/admin";
import { saveSettings } from "@/app/actions/settings";
import { BarChart3, Megaphone, Save, Mail, Send, Star, Pin } from "lucide-react";
import BroadcastButton from "../BroadcastButton";
import { triggerWeeklyDigest } from "@/app/actions/broadcast";
import { adminSendCustomEmail, adminSetFeaturedPlate } from "@/app/actions/admin";
import CustomEmailForm from "./CustomEmailForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: settings }, { count: userCount }, { data: topPlates }] = await Promise.all([
    supabase.from("app_settings").select("analytics_id, site_announcement, featured_plate_id").eq("id", true).single(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("plates").select("id, title, image_url").eq("status", "approved").order("like_count", { ascending: false }).limit(20),
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

      {/* Email — Weekly Digest + Custom Broadcast */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" />
          <h2 className="font-bold text-app">Email</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-app">Weekly Digest</p>
              <p className="text-xs text-faint mt-0.5">Send &quot;your week on Rate My Plate&quot; to all {userCount ?? 0} users now.</p>
            </div>
            <BroadcastButton
              action={triggerWeeklyDigest}
              label="Send Digest Now"
              confirmText="Send to all users"
              colorClass="bg-violet-600 hover:bg-violet-500"
              count={userCount ?? 0}
            />
          </div>
          <div className="border-t border-app-1 pt-5">
            <p className="text-sm font-semibold text-app mb-1">Custom Broadcast</p>
            <p className="text-xs text-faint mb-4">Write a one-off email to all {userCount ?? 0} users.</p>
            <CustomEmailForm action={adminSendCustomEmail} />
          </div>
          <p className="text-xs text-faint border-t border-app-1 pt-4">
            <Send className="w-3 h-3 inline mr-1" />
            Automate weekly digest: cron job → <code className="bg-surface-2 px-1.5 py-0.5 rounded text-orange-400">/api/cron/weekly-digest</code> with header <code className="bg-surface-2 px-1.5 py-0.5 rounded text-orange-400">x-cron-secret</code>
          </p>
        </div>
      </div>

      {/* Featured Plate */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <Pin className="w-4 h-4 text-rose-400" />
          <h2 className="font-bold text-app">Featured Plate</h2>
        </div>
        <div className="p-6">
          <p className="text-xs text-faint mb-4">Pin one plate to the top of the homepage feed. Currently: {settings?.featured_plate_id ? <span className="text-orange-400 font-semibold">set</span> : <span className="text-faint">none</span>}</p>
          <div className="space-y-2">
            {settings?.featured_plate_id && (
              <form action={adminSetFeaturedPlate.bind(null, null)}>
                <button type="submit" className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition-colors">
                  Clear featured plate
                </button>
              </form>
            )}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(topPlates ?? []).map((p) => (
                <form key={p.id} action={adminSetFeaturedPlate.bind(null, p.id)}>
                  <button
                    type="submit"
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all border ${
                      settings?.featured_plate_id === p.id
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold"
                        : "border-transparent hover:border-app-1 hover:bg-surface-2 text-muted"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 flex-shrink-0 ${settings?.featured_plate_id === p.id ? "text-orange-400 fill-orange-400" : "text-faint"}`} />
                    <span className="truncate">{p.title}</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
