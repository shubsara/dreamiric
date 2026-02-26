import { useState } from "react";
import { X, Sparkles, Moon, Brain, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetentionBannerProps {
  dreamCount: number;
  lastDreamDate?: string | null;
  onNewDream: () => void;
}

const MESSAGES = [
  {
    min: 0,
    max: 0,
    icon: Moon,
    title: "Your dream journal awaits",
    body: "Start logging your dreams to uncover hidden patterns about yourself. Even fragments count!",
    cta: "Log Your First Dream",
  },
  {
    min: 1,
    max: 2,
    icon: Sparkles,
    title: "Great start! Keep the momentum",
    body: "The more dreams you record, the deeper your self-understanding grows. Try capturing tonight's dream.",
    cta: "Add Another Dream",
  },
  {
    min: 3,
    max: 5,
    icon: Brain,
    title: "Patterns are emerging…",
    body: "With a few more entries, our AI can reveal recurring themes and emotional patterns unique to you.",
    cta: "Log a New Dream",
  },
  {
    min: 6,
    max: Infinity,
    icon: Flame,
    title: "You're on a roll!",
    body: "Consistent dream journaling deepens self-awareness. Don't break your streak — log tonight's dream!",
    cta: "Continue Your Journey",
  },
];

function getDaysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function RetentionBanner({ dreamCount, lastDreamDate, onNewDream }: RetentionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const daysSince = getDaysSince(lastDreamDate);

  if (dismissed) return null;

  // If user logged a dream today, don't nag
  if (daysSince === 0) return null;

  // Pick message tier
  let msg = MESSAGES.find((m) => dreamCount >= m.min && dreamCount <= m.max) ?? MESSAGES[MESSAGES.length - 1];

  // Override message if user hasn't logged in a while
  if (daysSince !== null && daysSince >= 3) {
    msg = {
      ...msg,
      title: `It's been ${daysSince} days since your last dream`,
      body: "Your subconscious has stories to tell. Capture them before they fade — every dream adds to your self-portrait.",
    };
  }

  const Icon = msg.icon;

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-4 space-y-3 animate-dream-in">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground leading-tight">
            {msg.title}
          </h3>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {msg.body}
          </p>
        </div>
      </div>

      <button
        onClick={onNewDream}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-body font-medium transition-all",
          "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {msg.cta}
      </button>
    </div>
  );
}
