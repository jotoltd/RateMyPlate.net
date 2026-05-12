import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Plate } from "@/lib/types";
import { scoreToStars } from "@/lib/utils";

type PlateCardProps = {
  plate: Plate;
};

export default function PlateCard({ plate }: PlateCardProps) {
  const rawRating = plate.avg_user_rating ?? plate.ai_rating ?? null;
  const displayStars = rawRating !== null ? scoreToStars(rawRating) : null;

  return (
    <Link href={`/plate/${plate.id}`} className="group block">
      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 border border-gray-100 dark:border-gray-800">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={plate.image_url}
            alt={plate.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Star badge */}
          {displayStars !== null && (
            <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl px-2.5 py-1.5 flex items-center gap-1 shadow-lg">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-800 dark:text-white leading-none">
                {displayStars.toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400 leading-none">/5</span>
            </div>
          )}

          {/* Category pill on image */}
          {plate.category && plate.category !== "other" && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
                {plate.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1 group-hover:text-orange-500 transition-colors mb-1.5">
            {plate.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[65%]">
              @{plate.profiles?.username ?? "chef"}
            </span>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {(plate.like_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-rose-400 font-semibold">
                  <Heart className="w-3 h-3 fill-rose-400" />
                  {plate.like_count}
                </span>
              )}
              {plate.rating_count > 0 && (
                <span className="text-xs text-gray-400">
                  {plate.rating_count} review{plate.rating_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
