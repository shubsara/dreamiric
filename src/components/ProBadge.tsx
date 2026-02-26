import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function ProBadge({ className, size = "sm" }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-body font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Crown className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      PRO
    </span>
  );
}
