import { requireAdmin } from "@/lib/admin";
import { saveSettings } from "@/app/actions/settings";
import { BarChart3, Megaphone, Save } from "lucide-react";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("analytics_id, site_announcement")
    .eq("id", true)
    .single();

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

    </div>
  );
}
