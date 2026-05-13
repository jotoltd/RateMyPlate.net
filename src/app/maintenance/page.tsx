"use client";

import { useState, useTransition, useEffect } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";
import { ChefHat, Flame, Star, CheckCircle2, Trophy, Globe, Heart } from "lucide-react";

const AVATARS = [
  { avatar: "A", color: "from-orange-400 to-rose-500" },
  { avatar: "S", color: "from-violet-400 to-purple-500" },
  { avatar: "M", color: "from-emerald-400 to-teal-500" },
  { avatar: "J", color: "from-blue-400 to-cyan-500" },
  { avatar: "R", color: "from-amber-400 to-orange-500" },
];

const REVIEWS = [
  { text: "This lasagne is an absolute disgrace. Soggy, pale, and tastes of regret.", rating: 2, dish: "Homemade Lasagne", from: "🇬🇧 London" },
  { text: "Finally — someone who knows how to sear a steak. Beautiful crust, perfect pink. I'm genuinely impressed.", rating: 9, dish: "Ribeye Steak", from: "🇺🇸 New York" },
  { text: "This carbonara has cream in it. CREAM. Get out of my kitchen.", rating: 1, dish: "Carbonara", from: "🇮🇹 Rome" },
  { text: "The plating is chaotic but the flavours are there. 7 from me — try harder with the presentation.", rating: 7, dish: "Chicken Tikka", from: "🇮🇳 Mumbai" },
  { text: "Clean, confident, delicious. This is what home cooking should look like.", rating: 8, dish: "Avocado Toast", from: "🇦🇺 Sydney" },
];

export default function MaintenancePage({ initialCount = 0 }: { initialCount?: number }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(initialCount);
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    fetch("/api/waitlist-count").then(r => r.json()).then(d => {
      if (d.count) setCount(d.count);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 3500);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await joinWaitlist(fd);
      if (res?.error) setError(res.error);
      else { setDone(true); setCount(c => c + 1); }
    });
  }

  const review = REVIEWS[reviewIdx];

  return (
    <div className="rmp-bg relative min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="rmp-glow-top absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-orange-600/25 via-rose-600/10 to-transparent blur-3xl" />
        <div className="rmp-glow-bl absolute bottom-0 left-0 w-80 h-80 bg-violet-700/10 blur-3xl" />
        <div className="rmp-glow-br absolute bottom-0 right-0 w-80 h-80 bg-rose-700/10 blur-3xl" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #f97316 0%, #fbbf24 40%, #f43f5e 60%, #f97316 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fadein { animation: fadein 0.4s ease both; }

        /* Light mode overrides */
        @media (prefers-color-scheme: light) {
          .rmp-bg { background: #f8f5f2 !important; }
          .rmp-card { background: #ffffff !important; border-color: #e5e0d8 !important; }
          .rmp-text-main { color: #1a1208 !important; }
          .rmp-text-muted { color: #6b5e4e !important; }
          .rmp-text-faint { color: #9c8878 !important; }
          .rmp-glow-top { background: radial-gradient(ellipse at top, rgba(251,146,60,0.18) 0%, transparent 70%) !important; }
          .rmp-input { background: #fff !important; border: 2px solid #d97706 !important; color: #1a1208 !important; }
          .rmp-input::placeholder { color: #b08060 !important; }
          .rmp-pill { background: rgba(249,115,22,0.12) !important; border-color: rgba(249,115,22,0.3) !important; }
          .rmp-val { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.08) !important; }
          .rmp-strip { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.06) !important; }
          .rmp-logo-text { color: #1a1208 !important; }
          .rmp-glow-bl, .rmp-glow-br { opacity: 0.15 !important; }
          .rmp-avatar-border { border-color: #f8f5f2 !important; }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="rmp-logo-text font-black text-lg text-white">Rate My Plate</span>
        </div>

        {/* Live review ticker */}
        <div key={reviewIdx} className="rmp-card fadein bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="rmp-text-muted text-white/60 text-xs font-bold">{review.dish}</span>
              <span className="rmp-text-faint text-white/30 text-[10px]">AI verdict</span>
            </div>
            <div className="ml-auto flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-xs font-black">{review.rating}/10</span>
              </div>
              <span className="rmp-text-faint text-white/25 text-[10px]">{review.from}</span>
            </div>
          </div>
          <p className="rmp-text-main text-white/70 text-sm italic leading-relaxed">&ldquo;{review.text}&rdquo;</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
            <span className="rmp-text-faint text-white/25 text-[10px] font-bold uppercase tracking-wider">Community also rated</span>
            <div className="flex items-center gap-1">
              {[8,7,9,6,8].map((s,i) => (
                <div key={i} className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded-md">
                  <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                  <span className="rmp-text-muted text-white/50 text-[10px] font-bold">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <div className="rmp-pill inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
            <Flame className="w-3 h-3" /> Opening soon
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3">
            <span className="rmp-text-main text-white">Is your cooking</span><br />
            <span className="shimmer-text">actually good?</span>
          </h1>
          <p className="rmp-text-muted text-white/45 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            Post your plate. Get rated by <span className="rmp-text-main text-white/70 font-semibold">real food lovers from around the world</span> — plus a brutally honest AI critique. Follow chefs, build your reputation, climb the leaderboard.
          </p>
        </div>

        {/* 3 value props */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: <Globe className="w-4 h-4 text-blue-400" />, label: "Global raters" },
            { icon: <Heart className="w-4 h-4 text-rose-400" />, label: "Follow chefs" },
            { icon: <Trophy className="w-4 h-4 text-amber-400" />, label: "Leaderboard" },
          ].map(({ icon, label }) => (
            <div key={label} className="rmp-val flex flex-col items-center gap-1.5 bg-white/4 border border-white/8 rounded-xl py-3 px-2">
              {icon}
              <span className="rmp-text-muted text-white/50 text-[10px] font-bold text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <div className="flex -space-x-2">
            {AVATARS.map((u) => (
              <div key={u.avatar} className={`rmp-avatar-border w-7 h-7 rounded-full bg-gradient-to-br ${u.color} border-2 border-[#080808] flex items-center justify-center`}>
                <span className="text-white text-[10px] font-black">{u.avatar}</span>
              </div>
            ))}
          </div>
          <p className="rmp-text-muted text-white/40 text-xs font-semibold">
            <span className="rmp-text-main text-white font-black">{count > 0 ? `${count.toLocaleString()}` : "..."}</span> food lovers worldwide already waiting
          </p>
        </div>

        {/* FORM / SUCCESS */}
        {done ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center fadein">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-lg font-black rmp-text-main text-white mb-1">You&rsquo;re in! 🎉</p>
            <p className="rmp-text-muted text-white/50 text-sm mb-4">We&rsquo;ll email you the moment we launch.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> Early-access badge reserved for you
            </div>
            <p className="rmp-text-faint text-white/25 text-xs mt-4">Tell a friend → more people means faster launch 👇</p>
            <a
              href={`https://twitter.com/intent/tweet?text=Just joined the waitlist for Rate My Plate — an AI that rates your food like Gordon Ramsay would 🍽🔥 ratemyplate.net`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rmp-text-muted text-white/70 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Share on X / Twitter
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="your@email.com"
                  className="rmp-input flex-1 px-4 py-4 bg-white/15 border-2 border-white/40 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-black rounded-xl text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap"
                >
                  {isPending ? "..." : "Join →"}
                </button>
              </div>
              {error && <p className="text-rose-500 text-xs font-semibold px-1 pt-1">{error}</p>}
            </form>
            <p className="text-center rmp-text-faint text-white/20 text-xs">Free forever · No spam · Unsubscribe anytime</p>
          </div>
        )}
      </div>
    </div>
  );
}
