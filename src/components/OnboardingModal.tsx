"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Upload, Star, Trophy, Zap, ArrowRight, X } from "lucide-react";

const STEPS = [
  {
    icon: <ChefHat className="w-10 h-10 text-white" />,
    gradient: "from-orange-500 to-rose-500",
    title: "Welcome to Rate My Plate! 🎉",
    subtitle: "The world's most honest food critic lives here.",
    body: "Share your plates, get brutally honest AI ratings from Gordon Ramsay's digital twin, and see how you stack up against other home chefs.",
  },
  {
    icon: <Upload className="w-10 h-10 text-white" />,
    gradient: "from-rose-500 to-pink-600",
    title: "Upload a Plate",
    subtitle: "Takes 30 seconds.",
    body: "Snap or pick a photo of your food. Give it a title, pick a category, and submit — our AI critiques it instantly. You earn 10 points just for uploading.",
    pill: "+10 pts for every upload",
  },
  {
    icon: <Star className="w-10 h-10 text-white" />,
    gradient: "from-amber-500 to-orange-500",
    title: "Rate & Get Rated",
    subtitle: "Community scores matter.",
    body: "Rate other chefs' plates 1–5 stars with a comment. When others rate yours, you earn points too — up to 500 per plate from ratings alone.",
    pill: "Up to 500 pts per plate from ratings",
  },
  {
    icon: <Trophy className="w-10 h-10 text-white" />,
    gradient: "from-violet-500 to-purple-600",
    title: "Climb the Leaderboard",
    subtitle: "Who's the top chef?",
    body: "The leaderboard ranks the best-rated plates. Comments earn you points too — up to 500 per plate. The max you can earn from one plate is 1,010 points.",
    pill: "Max 1,010 pts per plate",
  },
  {
    icon: <Zap className="w-10 h-10 text-white" />,
    gradient: "from-orange-500 to-rose-500",
    title: "You're ready. Let's go!",
    subtitle: "Upload your first plate now.",
    body: "Your AI rating will appear within seconds. Don't worry — even Ramsay started somewhere.",
    cta: "Upload My First Plate",
  },
];

export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      setDismissed(true);
      router.replace("/upload");
    } else {
      setStep(step + 1);
    }
  }

  function handleSkip() {
    setDismissed(true);
    router.replace("/upload");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-surface-1 border border-app-1 rounded-3xl overflow-hidden shadow-2xl">
        {/* Skip */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-faint hover:text-muted transition-colors z-10"
          aria-label="Skip"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gradient banner */}
        <div className={`bg-gradient-to-br ${current.gradient} p-10 flex items-center justify-center`}>
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center shadow-xl">
            {current.icon}
          </div>
        </div>

        {/* Content */}
        <div className="p-7">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-2xl font-black text-app mb-1">{current.title}</h2>
          <p className="text-sm font-semibold text-orange-400 mb-3">{current.subtitle}</p>
          <p className="text-muted text-sm leading-relaxed mb-4">{current.body}</p>

          {"pill" in current && current.pill && (
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-4">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{current.pill}</span>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex gap-1.5 justify-center mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-orange-500" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {"cta" in current && current.cta ? current.cta : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
