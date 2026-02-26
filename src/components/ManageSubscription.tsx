import { useEffect, useState } from "react";
import { Crown, Calendar, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  plan: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  expires_at: string | null;
}

export function ManageSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, amount, currency, created_at, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub(data);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="rounded-2xl bg-muted/40 h-28 animate-pulse" />;
  }

  if (!sub) return null;

  const planLabel = sub.plan === "annual" ? "Annual" : "Monthly";
  const priceLabel =
    sub.plan === "annual" ? `₹${(sub.amount / 100).toLocaleString()}/yr` : `₹${(sub.amount / 100).toLocaleString()}/mo`;
  const expiresDate = sub.expires_at
    ? new Date(sub.expires_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const startDate = new Date(sub.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold text-foreground">
            Dreamiric Pro
          </p>
          <p className="text-[10px] text-primary font-body font-medium uppercase tracking-wider">
            {planLabel} Plan
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-body font-semibold">
          <Sparkles className="w-2.5 h-2.5" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-background/50 border border-border/50 p-2.5 space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CreditCard className="w-3 h-3" />
            <span className="text-[10px] font-body uppercase tracking-wider">Billing</span>
          </div>
          <p className="text-sm font-display font-semibold text-foreground">{priceLabel}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border/50 p-2.5 space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-body uppercase tracking-wider">Renews</span>
          </div>
          <p className="text-sm font-display font-semibold text-foreground">{expiresDate}</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground font-body text-center">
        Subscribed since {startDate}
      </p>
    </div>
  );
}
