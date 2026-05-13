import Image from "next/image";
import Link from "next/link";
import { Star, Heart, MessageSquare, Eye } from "lucide-react";
import { Plate } from "@/lib/types";
import { scoreToStars, formatDate } from "@/lib/utils";
import { imgUrl } from "@/lib/imageUrl";

export default function FeedPost({ plate }: { plate: Plate }) {
  const rawRating = plate.avg_user_rating ?? plate.ai_rating ?? null;
  const displayStars = rawRating !== null ? scoreToStars(rawRating) : null;
  const initial = (plate.profiles?.username ?? "C")[0].toUpperCase();

  return (
    <article className="bg-surface-1 border border-app-1 rounded-3xl overflow-hidden hover:border-orange-500/20 transition-all">
      {/* Header: avatar + name + date */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${plate.profiles?.id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 overflow-hidden flex items-center justify-center">
            {plate.profiles?.avatar_url ? (
              <Image
                src={plate.profiles.avatar_url}
                alt={initial}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-white font-black text-sm">{initial}</span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${plate.profiles?.id}`}
            className="font-bold text-app text-sm hover:text-orange-400 transition-colors"
          >
            @{plate.profiles?.username ?? "chef"}
          </Link>
          <p className="text-xs text-faint">{formatDate(plate.created_at)}</p>
        </div>
        {plate.category && plate.category !== "other" && (
          <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 text-[11px] font-bold uppercase tracking-wide flex-shrink-0">
            {plate.category}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="px-4 pb-3">
        <Link href={`/plate/${plate.id}`}>
          <h2 className="font-bold text-app text-base leading-snug hover:text-orange-400 transition-colors">
            {plate.title}
          </h2>
        </Link>
        {plate.description && (
          <p className="text-sm text-muted mt-1 line-clamp-2">{plate.description}</p>
        )}
      </div>

      {/* Full-width image */}
      <Link href={`/plate/${plate.id}`} className="block relative w-full" style={{ aspectRatio: "4/3" }}>
        <Image
          src={imgUrl(plate.image_url, { width: 720, quality: 85 })}
          alt={plate.title}
          fill
          className="object-cover"
          sizes="(max-width: 680px) 100vw, 680px"
        />
        {displayStars !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-lg">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-white leading-none">{displayStars.toFixed(1)}</span>
            <span className="text-xs text-white/50">/5</span>
          </div>
        )}
      </Link>

      {/* Footer: likes, ratings, views */}
      <div className="flex items-center gap-5 px-4 py-3 border-t border-app-1">
        {(plate.like_count ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            {plate.like_count}
          </span>
        )}
        {(plate.rating_count ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            {plate.rating_count} {plate.rating_count === 1 ? "rating" : "ratings"}
          </span>
        )}
        {(plate.view_count ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-faint">
            <Eye className="w-4 h-4" />
            {plate.view_count}
          </span>
        )}
        <Link
          href={`/plate/${plate.id}`}
          className="ml-auto flex items-center gap-1.5 text-sm text-muted hover:text-orange-400 transition-colors font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          View &amp; Rate
        </Link>
      </div>
    </article>
  );
}
