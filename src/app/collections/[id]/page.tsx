import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookMarked } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { removePlateFromCollection } from "@/app/actions/collections-boards";
import PlateCard from "@/components/PlateCard";
import { Plate } from "@/lib/types";
import RemovePlateButton from "@/components/RemovePlateButton";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!collection) notFound();

  const { data: rows } = await supabase
    .from("collection_plates")
    .select("plate_id, added_at, plate:plate_id(*, profiles(id, username, avatar_url))")
    .eq("collection_id", id)
    .order("added_at", { ascending: false });

  const plates = (rows ?? []).map((r) => r.plate) as unknown as Plate[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-orange-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> My Collections
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <BookMarked className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{collection.name}</h1>
          {collection.description && <p className="text-white/40 text-sm mt-1">{collection.description}</p>}
          <p className="text-xs text-white/20 mt-1">{plates.length} {plates.length === 1 ? "plate" : "plates"}</p>
        </div>
      </div>

      {plates.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No plates in this collection yet</p>
          <p className="text-sm mt-1">Add plates from their detail page</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {plates.map((plate) => (
            <div key={plate.id} className="relative group">
              <PlateCard plate={plate} />
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <RemovePlateButton collectionId={id} plateId={plate.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
