import { Moon, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  image_url: string | null;
  created_at: string;
}

interface DreamCardProps {
  dream: Dream;
  onClick: () => void;
  delay?: number;
}

export function DreamCard({ dream, onClick, delay = 0 }: DreamCardProps) {
  const date = new Date(dream.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl overflow-hidden",
        "bg-dream-card nebula-border hover:border-primary/40",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-dream",
        "animate-dream-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Dream image */}
      <div className="relative h-40 overflow-hidden">
        {dream.image_url ? (
          <img
            src={dream.image_url}
            alt={dream.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-dream-aurora flex items-center justify-center">
            <Moon className="w-10 h-10 text-primary/40 float" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

        {/* Emotional theme badge */}
        {dream.emotional_theme && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-body font-medium bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {dream.emotional_theme}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-display font-medium text-foreground text-base leading-tight line-clamp-1 group-hover:text-dream-glow transition-colors">
          {dream.title}
        </h3>
        <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed">
          {dream.dream_text}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground/70 font-body">{formattedDate}</span>
          <span className="text-xs text-muted-foreground/50 font-body">{formattedTime}</span>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-primary font-body">
          <Eye className="w-3 h-3" />
          <span>Explore dream</span>
        </div>
      </div>
    </button>
  );
}
