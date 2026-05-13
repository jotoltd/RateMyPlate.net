"use client";

import { useState, useTransition, useEffect } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";
import { ChefHat, Flame, Star, Users, Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";

const FEATURES = [
  { icon: "🤖", label: "AI food critiques" },
  { icon: "⭐", label: "Community ratings" },
  { icon: "🔥", label: "Trending feed" },
  { icon: "👨‍🍳", label: "Chef community" },
];

const SOCIAL_PROOF = [
  { avatar: "A", color: "from-orange-400 to-rose-500", name: "Alex" },
  { avatar: "S", color: "from-violet-400 to-purple-500", name: "Sam" },
  { avatar: "M", color: "from-emerald-400 to-teal-500", name: "Mia" },
  { avatar: "J", color: "from-blue-400 to-cyan-500", name: "Jake" },
  { avatar: "R", color: "from-amber-400 to-orange-500", name: "Rosa" },
];

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
        <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function MaintenancePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [particlePos] = useState(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      dur: Math.random() * 3 + 2,
    }))
  );

  // Countdown to next round hour
  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diff = Math.max(0, next.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown({ h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("email", email);
    fd.set("name", name);
    startTransition(async () => {
      const res = await joinWaitlist(fd);
      if (res?.error) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <div className="relative min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">

      {/* Animated background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-orange-600/30 via-rose-600/15 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-700/15 blur-3xl" style={{ animation: "float 6s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-700/15 blur-3xl" style={{ animation: "float 6s ease-in-out infinite 3s" }} />
        {/* Floating particles */}
        {particlePos.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-orange-400/30"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.dur}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #f97316 0%, #fff 40%, #f43f5e 60%, #f97316 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-lg text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl text-white tracking-tight">Rate My Plate</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
          <Clock className="w-3 h-3" />
          Back very soon
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-black leading-[0.95] mb-5">
          <span className="text-white">We&rsquo;re cooking</span>
          <br />
          <span className="shimmer-text">something big</span>
        </h1>

        <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto">
          Rate My Plate is getting a major upgrade. Drop your email to be first in line when we&rsquo;re back — plus an exclusive early-access badge.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FEATURES.map((f) => (
            <span key={f.label} className="flex items-center gap-1.5 bg-white/5 border border-white/8 text-white/60 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span>{f.icon}</span>{f.label}
            </span>
          ))}
        </div>

        {/* Lead capture */}
        <div className="bg-white/5 border border-white/8 rounded-3xl p-6 sm:p-8 backdrop-blur-sm mb-8">
          {done ? (
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-white">You&rsquo;re on the list! 🎉</p>
                <p className="text-white/50 text-sm mt-1">We&rsquo;ll hit you up the moment we&rsquo;re live.</p>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-4 py-2 rounded-full">
                <Star className="w-3.5 h-3.5 fill-orange-400" />
                Early-access badge reserved
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Get early access
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                {error && (
                  <p className="text-rose-400 text-xs font-semibold text-left px-1">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-black py-4 rounded-xl text-base transition-all disabled:opacity-50 shadow-xl shadow-orange-500/30 active:scale-[0.98]"
                >
                  <Flame className="w-4 h-4" />
                  {isPending ? "Saving your spot…" : "Notify me when we're live"}
                  {!isPending && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
              <p className="text-white/20 text-xs mt-3">No spam. One email only. Unsubscribe anytime.</p>
            </>
          )}
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Back online in approximately</p>
          <div className="flex items-center justify-center gap-3">
            <CountdownUnit value={countdown.h} label="hrs" />
            <span className="text-2xl font-black text-white/20 mb-4">:</span>
            <CountdownUnit value={countdown.m} label="min" />
            <span className="text-2xl font-black text-white/20 mb-4">:</span>
            <CountdownUnit value={countdown.s} label="sec" />
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {SOCIAL_PROOF.map((u) => (
              <div key={u.name} className={`w-7 h-7 rounded-full bg-gradient-to-br ${u.color} border-2 border-[#080808] flex items-center justify-center`}>
                <span className="text-white text-[10px] font-black">{u.avatar}</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs font-semibold">
            <span className="text-white font-black">247+</span> chefs already waiting
          </p>
          <Users className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>
    </div>
  );
}
