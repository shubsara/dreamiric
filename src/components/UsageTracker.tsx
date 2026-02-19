import { Flame, Lock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 10;

interface UsageTrackerProps {
  dreamCount: number;
  isSubscribed?: boolean;
  onUpgrade: () => void;
  compact?: boolean;
}

export function UsageTracker({ dreamCount, isSubscribed, onUpgrade, compact = false }: UsageTrackerProps) {
  if (isSubscribed) return null;

  const used = Math.min(dreamCount, FREE_LIMIT);
  const pct = (used / FREE_LIMIT) * 100;
  const remaining = Math.max(FREE_LIMIT - dreamCount, 0);
  const isNearLimit = dreamCount >= 7 && dreamCount < FREE_LIMIT;
  const isAtLimit = dreamCount >= FREE_LIMIT;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl px-3 py-2.5 space-y-1.5 border",
          isAtLimit
            ? "bg-destructive/10 border-destructive/30"
            : isNearLimit
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-primary/5 border-primary/15"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame
              className={cn(
                "w-3 h-3",
                isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-400" : "text-primary"
              )}
            />
            <span
              className={cn(
                "text-xs font-body font-medium",
                isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-400" : "text-primary"
              )}
            >
              {isAtLimit ? "Free limit reached" : `${remaining} free dream${remaining !== 1 ? "s" : ""} left`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-body">{used}/{FREE_LIMIT}</span>
        </div>
        <Progress
          value={pct}
          className={cn(
            "h-1.5",
            isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-400" : ""
          )}
        />
        {(isNearLimit || isAtLimit) && (
          <button
            onClick={onUpgrade}
            className={cn(
              "w-full text-xs font-body font-medium py-1.5 rounded-lg transition-all",
              isAtLimit
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "text-primary hover:bg-primary/10 underline"
            )}
          >
            {isAtLimit ? "Unlock unlimited dreams →" : "Upgrade to Pro"}
          </button>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div
      className={cn(
        "rounded-2xl p-4 border space-y-3",
        isAtLimit
          ? "bg-destructive/10 border-destructive/30"
          : isNearLimit
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-primary/5 border-primary/15"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            className={cn(
              "w-4 h-4",
              isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-400" : "text-primary"
            )}
          />
          <span className="text-sm font-body font-medium text-foreground">Dream Entries</span>
        </div>
        <span className="text-sm font-display font-semibold text-foreground">
          {used} / {FREE_LIMIT}
        </span>
      </div>

      <Progress
        value={pct}
        className={cn(
          "h-2",
          isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-400" : ""
        )}
      />

      {isAtLimit ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-destructive" />
            <p className="text-xs text-destructive font-body font-medium">Free limit reached</p>
          </div>
          <Button
            onClick={onUpgrade}
            size="sm"
            className="w-full bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl font-body text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Unlock Unlimited Dreams
          </Button>
        </div>
      ) : isNearLimit ? (
        <div className="space-y-1.5">
          <p className="text-xs text-amber-400 font-body">
            Only {remaining} free entr{remaining !== 1 ? "ies" : "y"} remaining
          </p>
          <button
            onClick={onUpgrade}
            className="text-xs text-primary font-body underline hover:no-underline"
          >
            Upgrade for unlimited access
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-body">
          {remaining} free dream entr{remaining !== 1 ? "ies" : "y"} remaining
        </p>
      )}
    </div>
  );
}
