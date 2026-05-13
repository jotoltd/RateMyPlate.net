import Link from "next/link";
import { User, ArrowLeft, Users } from "lucide-react";

export default function ProfileNotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />
      <div className="relative text-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
          <User className="w-8 h-8 text-white" />
        </div>
        <p className="text-8xl font-black text-faintest mb-2 leading-none select-none">404</p>
        <h1 className="text-2xl font-black text-app -mt-4 mb-3">Chef not found</h1>
        <p className="text-muted text-sm mb-8">
          This chef doesn&apos;t exist or has deleted their account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/chefs"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Users className="w-4 h-4" />
            Discover Chefs
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-app-1 text-muted px-6 py-3 rounded-xl font-bold hover:border-orange-500/40 hover:text-orange-400 transition-all bg-surface-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
