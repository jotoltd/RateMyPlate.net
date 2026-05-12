import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import { Plate } from "@/lib/types";

export const metadata = { title: "Saved Plates – Rate My Plate" };

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: saved } = await supabase
    .from("saved_plates")
    .select("plate_id, plates(*, profiles(id, username, avatar_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const plates = ((saved ?? [])
    .map((s) => s.plates)
    .filter(Boolean) as unknown[]) as Plate[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
          <Bookmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Plates</h1>
          <p className="text-sm text-white/40">{plates.length} plate{plates.length !== 1 ? "s" : ""} saved</p>
        </div>
      </div>

      {plates.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No saved plates yet</p>
          <p className="text-sm mt-1 mb-6">Tap the bookmark on any plate to save it here</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Browse Plates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {plates.map((plate) => (
            <PlateCard key={plate.id} plate={plate} />
          ))}
        </div>
      )}
    </div>
  );
}
