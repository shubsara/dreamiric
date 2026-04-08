import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, BookOpen, TrendingUp, Plus, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "dreamiric_onboarding_completed";

interface TourStep {
  title: string;
  description: string;
  icon: typeof BookOpen;
  highlight: string; // CSS selector hint (visual only)
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Dreamiric! 🌙",
    description: "Your personal AI-powered dream journal. Let's take a quick tour to help you get started.",
    icon: Sparkles,
    highlight: "welcome",
  },
  {
    title: "Journal Tab",
    description: "This is your dream feed. All your recorded dreams appear here as beautiful cards. Tap any card to view the full AI analysis, symbols, and chat with your dream.",
    icon: BookOpen,
    highlight: "journal",
  },
  {
    title: "Add a New Dream",
    description: "Tap the '+' button to record a new dream. You can type it out or use voice recording — our AI will analyze it instantly with symbols, themes, and a unique dream image.",
    icon: Plus,
    highlight: "new-dream",
  },
  {
    title: "Patterns Tab",
    description: "After recording 7+ dreams, unlock your Dream Pattern Analysis — see recurring symbols, emotional trends, and psychological insights across all your dreams.",
    icon: TrendingUp,
    highlight: "patterns",
  },
  {
    title: "Dream Streak",
    description: "Track your consistency! The streak counter shows how many consecutive days you've logged dreams. Build a habit and unlock deeper self-awareness.",
    icon: Flame,
    highlight: "streak",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleComplete} />

      {/* Tour Card */}
      <div className="relative w-full max-w-md animate-dream-in">
        <div className="bg-dream-card nebula-border rounded-2xl p-6 shadow-dream space-y-5">
          {/* Close */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
              "bg-primary/10 border border-primary/20"
            )}>
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {current.title}
            </h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {isFirst ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleComplete}
                className="text-muted-foreground font-body text-xs"
              >
                Skip Tour
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1 text-muted-foreground font-body text-xs"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="gap-1.5 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-6 font-body font-medium shadow-dream"
            >
              {isLast ? "Start Journaling" : "Next"}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) !== "true";
}
