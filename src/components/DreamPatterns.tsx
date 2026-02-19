import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Sparkles, TrendingUp, Hash, Calendar, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Dream {
  id: string;
  title: string;
  dream_text: string;
  emotional_theme: string | null;
  symbols: Array<{ name: string; meaning: string }> | null;
  created_at: string;
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

// Simple calendar heatmap – shows past 6 months
function CalendarHeatmap({ dreamsByDate }: { dreamsByDate: Record<string, number> }) {
  const today = new Date();
  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];

  // Go back ~26 weeks
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 26 * 7);
  // Align to Sunday
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

  // Month labels
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
      {/* Month labels */}
      <div className="flex gap-1 ml-6" style={{ minWidth: `${weeks.length * 18}px` }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.col === wi);
          return (
            <div key={wi} className="w-[14px] text-center">
              {ml ? (
                <span className="text-[9px] text-muted-foreground font-body">{ml.label}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-3 h-[14px] flex items-center">
              {i % 2 === 1 && (
                <span className="text-[9px] text-muted-foreground font-body">{d}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1" style={{ minWidth: `${weeks.length * 18}px` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${day.count} dream${day.count !== 1 ? "s" : ""}` : ""}
                  className={cn(
                    "w-[14px] h-[14px] rounded-sm transition-all",
                    day ? getIntensity(day.count) : "bg-transparent"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
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

// Custom tooltip for bar chart
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

  // --- Data derivations ---

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
        const key = dream.emotional_theme;
        freq[key] = (freq[key] || 0) + 1;
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
            <p className="text-muted-foreground font-body text-sm py-8 text-center">
              No themes recorded yet
            </p>
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
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                fill="hsl(262, 60%, 65%)"
                opacity={0.85}
              />
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

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={symbolFrequency}
              layout="vertical"
              barSize={14}
              margin={{ left: 0, right: 16 }}
            >
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
              <Bar
                dataKey="count"
                radius={[0, 6, 6, 0]}
                fill="hsl(38, 80%, 60%)"
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Symbol cloud */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground font-body mb-3 uppercase tracking-wider">Symbol cloud</p>
            <div className="flex flex-wrap gap-2">
              {symbolFrequency.map(({ name, count }, i) => {
                const size = count === 1 ? "text-xs" : count === 2 ? "text-sm" : "text-base";
                const opacity = 0.5 + (count / (symbolFrequency[0]?.count || 1)) * 0.5;
                return (
                  <span
                    key={name}
                    className={cn(
                      size,
                      "font-display font-medium px-3 py-1.5 rounded-full",
                      "bg-accent/10 border border-accent/20 text-accent"
                    )}
                    style={{ opacity }}
                    title={`Appeared in ${count} dream${count !== 1 ? "s" : ""}`}
                  >
                    {name}
                    {count > 1 && (
                      <span className="ml-1 text-[10px] text-accent/60">×{count}</span>
                    )}
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
