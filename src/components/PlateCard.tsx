import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Plate } from "@/lib/types";
import { scoreToStars } from "@/lib/utils";
import { imgUrl } from "@/lib/imageUrl";

type PlateCardProps = {
  plate: Plate;
};

export default function PlateCard({ plate }: PlateCardProps) {
  const rawRating = plate.avg_user_rating ?? plate.ai_rating ?? null;
  const displayStars = rawRating !== null ? scoreToStars(rawRating) : null;
  const initial = (plate.profiles?.username ?? "C")[0].toUpperCase();

  return (
    <Link href={`/plate/${plate.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/5" style={{ aspectRatio: "3/4" }}>
        {/* Full-bleed image */}
        <Image
          src={imgUrl(plate.image_url, { width: 400, quality: 80 })}
          alt={plate.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Star rating — top right */}
        {displayStars !== null && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-xl px-2 py-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black text-white leading-none">{displayStars.toFixed(1)}</span>
          </div>
        )}

        {/* Category — top left */}
        {plate.category && plate.category !== "other" && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-lg bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
              {plate.category}
            </span>
          </div>
        )}

        {/* Bottom: title + avatar + likes */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2">
            {plate.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {plate.profiles?.avatar_url ? (
                  <Image src={plate.profiles.avatar_url} alt={initial} width={20} height={20} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-white text-[9px] font-black">{initial}</span>
                )}
              </div>
              <span className="text-white/80 text-[11px] font-medium truncate max-w-[80px]">
                @{plate.profiles?.username ?? "chef"}
              </span>
            </div>
            {(plate.like_count ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-white/80 text-[11px] font-semibold">
                <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                {plate.like_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
