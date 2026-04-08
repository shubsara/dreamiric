import { useState, useEffect, useCallback, useRef } from "react";
import { X, ArrowRight, ArrowLeft, BookOpen, TrendingUp, Plus, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "dreamiric_onboarding_completed";

interface TourStep {
  title: string;
  description: string;
  icon: typeof BookOpen;
  selector: string; // data-tour attribute value
  position: "center" | "bottom" | "top"; // tooltip position relative to element
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Dreamiric! 🌙",
    description: "Your personal AI-powered dream journal. Let's take a quick tour to help you get started.",
    icon: Sparkles,
    selector: "",
    position: "center",
  },
  {
    title: "Journal Tab",
    description: "This is your dream feed. All your recorded dreams appear here as beautiful cards. Tap any card to view the full AI analysis, symbols, and chat with your dream.",
    icon: BookOpen,
    selector: "journal-tab",
    position: "bottom",
  },
  {
    title: "Add a New Dream",
    description: "Tap the '+' button to record a new dream. You can type it out or use voice recording — our AI will analyze it instantly with symbols, themes, and a unique dream image.",
    icon: Plus,
    selector: "new-dream-btn",
    position: "bottom",
  },
  {
    title: "Patterns Tab",
    description: "After recording 7+ dreams, unlock your Dream Pattern Analysis — see recurring symbols, emotional trends, and psychological insights across all your dreams.",
    icon: TrendingUp,
    selector: "patterns-tab",
    position: "bottom",
  },
  {
    title: "Dream Streak",
    description: "Track your consistency! The streak counter shows how many consecutive days you've logged dreams. Build a habit and unlock deeper self-awareness.",
    icon: Flame,
    selector: "streak-counter",
    position: "top",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const Icon = current.icon;
  const isCentered = current.position === "center" || !current.selector;

  const updateSpotlight = useCallback(() => {
    if (!current.selector) {
      setSpotlight(null);
      setTooltipStyle({});
      return;
    }

    const el = document.querySelector(`[data-tour="${current.selector}"]`);
    if (!el) {
      setSpotlight(null);
      setTooltipStyle({});
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;
    const s: SpotlightRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setSpotlight(s);

    // Position tooltip relative to spotlight
    requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 16;

      let top: number;
      let left: number;

      if (current.position === "bottom") {
        top = s.top + s.height + gap;
        left = s.left + s.width / 2 - tw / 2;
      } else {
        // top
        top = s.top - th - gap;
        left = s.left + s.width / 2 - tw / 2;
      }

      // Clamp within viewport
      left = Math.max(12, Math.min(left, vw - tw - 12));
      top = Math.max(12, Math.min(top, vh - th - 12));

      // If tooltip would overlap spotlight, flip
      if (current.position === "bottom" && top < s.top + s.height) {
        top = s.top - th - gap;
      } else if (current.position === "top" && top + th > s.top) {
        top = s.top + s.height + gap;
      }

      top = Math.max(12, Math.min(top, vh - th - 12));

      setTooltipStyle({ position: "fixed", top, left });
    });
  }, [current.selector, current.position, step]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [updateSpotlight]);

  const handleNext = () => {
    if (isLast) handleComplete();
    else setStep((s) => s + 1);
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
    <div className="fixed inset-0 z-[100]">
      {/* SVG overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="black"
              >
                <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" />
              </rect>
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%" 
          fill="hsl(var(--background) / 0.85)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: "all" }}
          onClick={handleComplete}
        />
      </svg>

      {/* Spotlight ring glow */}
      {spotlight && (
        <div
          className="absolute rounded-xl border-2 border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.3)] pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        >
          <div className="absolute inset-0 rounded-xl animate-pulse border border-primary/20" />
        </div>
      )}

      {/* Tooltip / Tour card */}
      <div
        ref={tooltipRef}
        className={cn(
          "z-[101] w-full max-w-sm animate-dream-in",
          isCentered
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-auto px-4"
            : ""
        )}
        style={isCentered ? {} : tooltipStyle}
      >
        <div className="bg-dream-card nebula-border rounded-2xl p-5 shadow-dream space-y-4 relative">
          {/* Close */}
          <button
            onClick={handleComplete}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step dots */}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <Icon className="w-7 h-7 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {current.title}
            </h3>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-1">
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
              size="sm"
              className="gap-1.5 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-5 font-body font-medium shadow-dream"
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
