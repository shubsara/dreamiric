import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Sparkles, TrendingUp, Hash, Calendar, Moon, Brain, RefreshCw, ChevronDown, ChevronUp, Zap, Compass, Eye, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  symbols: Array<{ name: string; meaning: string }> | null;
  created_at: string;
}

interface Archetype {
  name: string;
  description: string;
  evidence: string;
}

interface RecurringTheme {
  theme: string;
  psychologicalMeaning: string;
}

interface PsychologicalProfile {
  dominantArchetypes: Archetype[];
  shadowAspects: string;
  animaAnimus: string | null;
  selfJourney: string;
  recurringThemes: RecurringTheme[];
  unconsciousMessages: string;
  growthEdges: string[];
  overallTone: string;
  summary: string;
}

const THEME_COLORS = [
  "hsl(262, 60%, 65%)",
  "hsl(38, 80%, 60%)",
  "hsl(190, 70%, 55%)",
  "hsl(330, 65%, 60%)",
  "hsl(160, 60%, 50%)",
  "hsl(280, 55%, 60%)",
  "hsl(45, 90%, 55%)",
  "hsl(210, 75%, 58%)",
];

const TONE_CONFIG: Record<string, { label: string; color: string; icon: typeof Brain }> = {
  "integrating": { label: "Integrating", color: "text-emerald-400", icon: Compass },
  "shadow-confronting": { label: "Shadow Confronting", color: "text-violet-400", icon: Eye },
  "transforming": { label: "Transforming", color: "text-amber-400", icon: Zap },
  "seeking": { label: "Seeking", color: "text-sky-400", icon: ArrowUpRight },
  "wounded-healer": { label: "Wounded Healer", color: "text-rose-400", icon: Brain },
  "ascending": { label: "Ascending", color: "text-primary", icon: TrendingUp },
};

// Simple calendar heatmap – shows past 6 months
function CalendarHeatmap({ dreamsByDate }: { dreamsByDate: Record<string, number> }) {
  const today = new Date();
  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 26 * 7);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let current = new Date(startDate);
  let week: Array<{ date: Date; count: number } | null> = [];

  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    week.push({ date: new Date(current), count: dreamsByDate[key] || 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const monthLabels: Array<{ label: string; col: number }> = [];
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d !== null);
    if (firstDay && firstDay.date.getDate() <= 7) {
      const label = firstDay.date.toLocaleDateString("en-US", { month: "short" });
      if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
        monthLabels.push({ label, col: wi });
      }
    }
  });

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/30 border border-border/30";
    if (count === 1) return "bg-primary/25 border border-primary/30";
    if (count === 2) return "bg-primary/50 border border-primary/50";
    return "bg-primary/80 border border-primary/70";
  };

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex gap-1 ml-6" style={{ minWidth: `${weeks.length * 18}px` }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.col === wi);
          return (
            <div key={wi} className="w-[14px] text-center">
              {ml ? <span className="text-[9px] text-muted-foreground font-body">{ml.label}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-3 h-[14px] flex items-center">
              {i % 2 === 1 && <span className="text-[9px] text-muted-foreground font-body">{d}</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-1" style={{ minWidth: `${weeks.length * 18}px` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${day.count} dream${day.count !== 1 ? "s" : ""}` : ""}
                  className={cn("w-[14px] h-[14px] rounded-sm transition-all", day ? getIntensity(day.count) : "bg-transparent")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-6 mt-1">
        <span className="text-[10px] text-muted-foreground font-body">Less</span>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn("w-[14px] h-[14px] rounded-sm", getIntensity(i))} />
        ))}
        <span className="text-[10px] text-muted-foreground font-body">More</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl text-xs font-body border border-border">
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-primary">{payload[0].value} dream{payload[0].value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl text-xs font-body border border-border">
        <p className="text-foreground font-medium">{payload[0].name}</p>
        <p className="text-primary">{payload[0].value} dream{payload[0].value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};

// ──────────────────────────────────────────────
// Psychological Profile Section
// ──────────────────────────────────────────────
function PsychologicalProfileSection({ dreamCount }: { dreamCount: number }) {
  const [profile, setProfile] = useState<PsychologicalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedArchetype, setExpandedArchetype] = useState<number | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("psychological-profile");
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setProfile(data.profile);
    } catch (e: any) {
      setError(e?.message || "Failed to generate profile");
    } finally {
      setLoading(false);
    }
  };

  const toneKey = profile?.overallTone?.toLowerCase() || "";
  const toneInfo = TONE_CONFIG[toneKey] || { label: profile?.overallTone || "", color: "text-primary", icon: Brain };
  const ToneIcon = toneInfo.icon;

  if (!profile && !loading && !error) {
    return (
      <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="font-display text-base font-medium text-foreground">Psychological Profile</h3>
          <span className="text-xs text-muted-foreground font-body ml-auto">Jungian depth analysis</span>
        </div>
        <div className="flex flex-col items-center py-8 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center pulse-glow">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-medium text-foreground">
              Synthesize your unconscious patterns
            </p>
            <p className="text-xs text-muted-foreground font-body max-w-xs">
              AI will read all {dreamCount} of your dreams and their chat conversations to build a holistic Jungian psychological portrait.
            </p>
          </div>
          <Button
            onClick={fetchProfile}
            className="gap-2 bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl px-6 font-body font-medium shadow-dream"
          >
            <Brain className="w-4 h-4" />
            Generate My Profile
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="font-display text-base font-medium text-foreground">Psychological Profile</h3>
        </div>
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground font-body">
            Diving into your unconscious... this may take a moment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="font-display text-base font-medium text-foreground">Psychological Profile</h3>
        </div>
        <p className="text-sm text-destructive font-body">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchProfile} className="gap-2 font-body">
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5">
      {/* Header with overall tone + summary */}
      <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-medium text-foreground">Psychological Profile</h3>
          </div>
          <button
            onClick={fetchProfile}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Regenerate profile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Overall tone badge */}
        <div className="flex items-center gap-2">
          <ToneIcon className={cn("w-4 h-4", toneInfo.color)} />
          <span className={cn("font-display text-sm font-medium", toneInfo.color)}>
            {toneInfo.label}
          </span>
          <span className="text-xs text-muted-foreground font-body">— current psychic orientation</span>
        </div>

        {/* Summary */}
        <p className="font-body text-sm text-foreground/85 leading-relaxed border-l-2 border-primary/30 pl-4">
          {profile.summary}
        </p>
      </div>

      {/* Dominant Archetypes */}
      {profile.dominantArchetypes?.length > 0 && (
        <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-display text-base font-medium text-foreground">Dominant Archetypes</h3>
          </div>
          <div className="space-y-3">
            {profile.dominantArchetypes.map((arch, i) => (
              <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedArchetype(expandedArchetype === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: THEME_COLORS[i % THEME_COLORS.length] }}
                    />
                    <span className="font-display text-sm font-medium text-foreground">{arch.name}</span>
                  </div>
                  {expandedArchetype === i
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedArchetype === i && (
                  <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">{arch.description}</p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed italic">
                      Evidence: {arch.evidence}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Shadow + Anima/Animus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-dream-card nebula-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <h3 className="font-display text-sm font-medium text-foreground">Shadow</h3>
          </div>
          <p className="font-body text-sm text-foreground/80 leading-relaxed">{profile.shadowAspects}</p>
        </div>

        {profile.animaAnimus && (
          <div className="bg-dream-card nebula-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-sky-400" />
              <h3 className="font-display text-sm font-medium text-foreground">Anima / Animus</h3>
            </div>
            <p className="font-body text-sm text-foreground/80 leading-relaxed">{profile.animaAnimus}</p>
          </div>
        )}
      </div>

      {/* Individuation / Self Journey */}
      <div className="bg-dream-card nebula-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display text-sm font-medium text-foreground">Individuation Journey</h3>
        </div>
        <p className="font-body text-sm text-foreground/80 leading-relaxed">{profile.selfJourney}</p>
      </div>

      {/* Recurring Themes with meanings */}
      {profile.recurringThemes?.length > 0 && (
        <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="font-display text-sm font-medium text-foreground">Recurring Psychological Themes</h3>
          </div>
          <div className="space-y-2">
            {profile.recurringThemes.map((t, i) => (
              <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <span className="font-display text-sm font-medium text-foreground text-left">{t.theme}</span>
                  {expandedTheme === i
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {expandedTheme === i && (
                  <div className="px-4 pb-4 border-t border-border/30 pt-3">
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">{t.psychologicalMeaning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unconscious messages */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-medium text-foreground">What Your Unconscious Is Saying</h3>
        </div>
        <p className="font-body text-sm text-foreground/85 leading-relaxed">{profile.unconsciousMessages}</p>
      </div>

      {/* Growth edges */}
      {profile.growthEdges?.length > 0 && (
        <div className="bg-dream-card nebula-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-sm font-medium text-foreground">Growth Edges</h3>
            <span className="text-xs text-muted-foreground font-body ml-auto">Areas calling for conscious attention</span>
          </div>
          <div className="space-y-2">
            {profile.growthEdges.map((edge, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-400/15 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-display font-medium">
                  {i + 1}
                </span>
                <p className="font-body text-sm text-foreground/80 leading-relaxed">{edge}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main DreamPatterns component
// ──────────────────────────────────────────────
export function DreamPatterns() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("dreams")
        .select("id, title, dream_text, emotional_theme, symbols, created_at")
        .order("created_at", { ascending: true });
      if (data) {
        setDreams(
          data.map(d => ({
            ...d,
            symbols: Array.isArray(d.symbols)
              ? (d.symbols as Array<{ name: string; meaning: string }>)
              : [],
          }))
        );
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const symbolFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    dreams.forEach(dream => {
      (dream.symbols || []).forEach(s => {
        const key = s.name.toLowerCase();
        freq[key] = (freq[key] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));
  }, [dreams]);

  const themeFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    dreams.forEach(dream => {
      if (dream.emotional_theme) {
        freq[dream.emotional_theme] = (freq[dream.emotional_theme] || 0) + 1;
      }
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [dreams]);

  const dreamsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    dreams.forEach(d => {
      const key = d.created_at.slice(0, 10);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [dreams]);

  const dreamsByDayOfWeek = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dreams.forEach(d => {
      counts[new Date(d.created_at).getDay()]++;
    });
    return days.map((name, i) => ({ name, count: counts[i] }));
  }, [dreams]);

  const totalDreams = dreams.length;
  const uniqueThemes = themeFrequency.length;
  const uniqueSymbols = symbolFrequency.length;
  const avgPerWeek = totalDreams > 0
    ? (totalDreams / Math.max(1, Math.ceil(
        (Date.now() - new Date(dreams[0]?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)
      ))).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <Moon className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground font-body text-sm">Analyzing your dream patterns...</p>
        </div>
      </div>
    );
  }

  if (totalDreams === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center pulse-glow">
          <TrendingUp className="w-9 h-9 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-display text-xl text-foreground">No patterns yet</h3>
          <p className="text-muted-foreground font-body text-sm max-w-xs">
            Record a few dreams to start discovering recurring symbols and emotional themes in your unconscious.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-dream-in pb-8">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <h2 className="font-display text-4xl font-semibold text-foreground">Dream Patterns</h2>
        <p className="text-muted-foreground font-body">
          The recurring threads of your unconscious mind
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Dreams", value: totalDreams, icon: Moon, color: "text-dream-glow" },
          { label: "Unique Themes", value: uniqueThemes, icon: Sparkles, color: "text-accent" },
          { label: "Unique Symbols", value: uniqueSymbols, icon: Hash, color: "text-primary" },
          { label: "Dreams / Week", value: avgPerWeek, icon: TrendingUp, color: "text-dream-glow" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-dream-card nebula-border rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">{label}</span>
            </div>
            <div className={cn("font-display text-3xl font-semibold", color)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Psychological Profile — placed prominently after stats */}
      <PsychologicalProfileSection dreamCount={totalDreams} />

      {/* Calendar heatmap */}
      <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-display text-base font-medium text-foreground">Dream Frequency</h3>
          <span className="text-xs text-muted-foreground font-body ml-auto">Past 6 months</span>
        </div>
        <CalendarHeatmap dreamsByDate={dreamsByDate} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotional Themes */}
        <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-display text-base font-medium text-foreground">Emotional Themes</h3>
          </div>
          {themeFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={themeFrequency}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {themeFrequency.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs font-body text-muted-foreground">{value}</span>
                  )}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground font-body text-sm py-8 text-center">No themes recorded yet</p>
          )}
        </div>

        {/* Day of Week */}
        <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-medium text-foreground">Dreams by Day</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dreamsByDayOfWeek} barSize={20}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(220 15% 50%)", fontFamily: "Inter" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(262 60% 65% / 0.05)" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(262, 60%, 65%)" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recurring Symbols */}
      {symbolFrequency.length > 0 && (
        <div className="bg-dream-card nebula-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-medium text-foreground">Recurring Symbols</h3>
            <span className="text-xs text-muted-foreground font-body ml-auto">Top {symbolFrequency.length}</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={symbolFrequency} layout="vertical" barSize={14} margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: "hsl(220 15% 50%)", fontFamily: "Inter" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(262 60% 65% / 0.05)" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="hsl(38, 80%, 60%)" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground font-body mb-3 uppercase tracking-wider">Symbol cloud</p>
            <div className="flex flex-wrap gap-2">
              {symbolFrequency.map(({ name, count }) => {
                const size = count === 1 ? "text-xs" : count === 2 ? "text-sm" : "text-base";
                const opacity = 0.5 + (count / (symbolFrequency[0]?.count || 1)) * 0.5;
                return (
                  <span
                    key={name}
                    className={cn(size, "font-display font-medium px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent")}
                    style={{ opacity }}
                    title={`Appeared in ${count} dream${count !== 1 ? "s" : ""}`}
                  >
                    {name}
                    {count > 1 && <span className="ml-1 text-[10px] text-accent/60">×{count}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
