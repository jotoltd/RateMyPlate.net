import Image from "next/image";
import Link from "next/link";
import { Star, User } from "lucide-react";
import { Plate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PlateCardProps = {
  plate: Plate;
};

export default function PlateCard({ plate }: PlateCardProps) {
  const displayRating =
    plate.avg_user_rating ?? plate.ai_rating ?? null;

  return (
    <Link href={`/plate/${plate.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={plate.image_url}
            alt={plate.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {displayRating !== null && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-md">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-800">
                {displayRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 line-clamp-1 group-hover:text-orange-500 transition-colors">
            {plate.title}
          </h3>
          {plate.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {plate.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium text-gray-600">
                {plate.profiles?.username ?? "Chef"}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {formatDate(plate.created_at)}
            </span>
          </div>
          {plate.rating_count > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              {plate.rating_count} rating{plate.rating_count !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
