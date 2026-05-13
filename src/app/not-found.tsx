import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />
      <div className="relative text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <p className="text-8xl font-black text-white/5 mb-2 leading-none select-none">404</p>
        <h1 className="text-2xl font-black text-white -mt-4 mb-3">Page not found</h1>
        <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">
          This plate doesn&apos;t exist — or it got eaten. Either way, it&apos;s gone.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
      </div>
    </div>
  );
}
