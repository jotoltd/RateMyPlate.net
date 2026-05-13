import { FeedSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-8 w-36 bg-white/5 rounded-xl animate-pulse mb-6" />
      <FeedSkeleton count={8} />
    </div>
  );
}
