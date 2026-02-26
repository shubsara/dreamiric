import { Flame } from "lucide-react";
import { useMemo } from "react";

interface DreamStreakProps {
  dreamDates: string[];
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(dates.map((d) => new Date(d).toDateString()))
  )
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = uniqueDays[0];
  mostRecent.setHours(0, 0, 0, 0);

  // Streak must include today or yesterday
  if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = uniqueDays[i - 1];
    const curr = uniqueDays[i];
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function DreamStreak({ dreamDates }: DreamStreakProps) {
  const streak = useMemo(() => calculateStreak(dreamDates), [dreamDates]);

  return (
    <div className="bg-dream-card rounded-2xl p-4 nebula-border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${streak > 0 ? "bg-accent/15" : "bg-muted"}`}>
        <Flame className={`w-5 h-5 ${streak > 0 ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-xl font-semibold text-foreground leading-tight">
          {streak} day{streak !== 1 ? "s" : ""}
        </div>
        <div className="text-xs text-muted-foreground font-body">
          {streak > 0 ? "Current streak 🔥" : "Log a dream to start!"}
        </div>
      </div>
    </div>
  );
}
