import { X, Sparkles, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionModalProps {
  onClose: () => void;
  onSubscribe?: (plan: "monthly" | "annual") => void;
  dreamCount: number;
}

const FEATURES = [
  "Unlimited dream entries",
  "AI-powered dream analysis",
  "Surrealist dream visualizations",
  "Psychological pattern insights",
  "Dream chat with AI guide",
  "Morning reminder notifications",
];

export function SubscriptionModal({ onClose, onSubscribe, dreamCount }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { plan: selectedPlan },
      });

      if (error || !data?.order_id) {
        throw new Error(error?.message || "Failed to create order");
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Dreamiric",
        description: selectedPlan === "annual" ? "Annual Plan – ₹999/yr" : "Monthly Plan – ₹99/mo",
        order_id: data.order_id,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#7c3aed",
        },
        handler: async (response: any) => {
          try {
            // Verify payment via webhook
            const { error: webhookError } = await supabase.functions.invoke("razorpay-webhook", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                user_id: user.id,
              },
            });
            if (webhookError) throw webhookError;
            toast({ title: "Payment successful!", description: "Welcome to Dreamiric Pro ✨" });
            onSubscribe?.(selectedPlan);
            onClose();
          } catch (err: any) {
            console.error("Verification error:", err);
            toast({ title: "Payment verification failed", description: err.message, variant: "destructive" });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast({ title: "Payment failed", description: response.error.description, variant: "destructive" });
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay error:", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-dream overflow-hidden animate-dream-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Limited-time discount banner */}
        <div className="mx-4 mt-4 mb-0 flex items-center justify-center gap-2 rounded-xl bg-primary/15 border border-primary/25 px-3 py-2 text-xs font-body text-primary font-medium animate-dream-in">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Pro plans now start at just <span className="font-semibold">₹99/mo</span></span>
        </div>

        {/* Header gradient */}
        <div className="relative px-6 pt-6 pb-6 bg-gradient-to-b from-primary/15 to-transparent">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center pulse-glow">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Unlock Your Dreamscape
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-1">
                You've used all {dreamCount} free entries. Upgrade for unlimited access.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Plan selector */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={cn(
                "relative rounded-2xl p-4 border text-left transition-all",
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/40 hover:border-primary/50"
              )}
            >
              <p className="text-xs text-muted-foreground font-body mb-1">Monthly</p>
              <p className="font-display text-xl font-semibold text-foreground">₹99</p>
              <p className="text-xs text-muted-foreground font-body">per month</p>
              {selectedPlan === "monthly" && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </button>

            {/* Annual */}
            <button
              onClick={() => setSelectedPlan("annual")}
              className={cn(
                "relative rounded-2xl p-4 border text-left transition-all",
                selectedPlan === "annual"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/40 hover:border-primary/50"
              )}
            >
              {/* Best value badge */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-body font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Save 33%
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Annual</p>
              <p className="font-display text-xl font-semibold text-foreground">₹999</p>
              <p className="text-xs text-muted-foreground font-body">per year</p>
              {selectedPlan === "annual" && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>

          {/* Annual per-month breakdown */}
          {selectedPlan === "annual" && (
            <p className="text-center text-xs text-muted-foreground font-body -mt-2">
              That's just <span className="text-primary font-medium">₹83/month</span> — billed annually
            </p>
          )}

          {/* Features list */}
          <div className="space-y-2.5 rounded-2xl bg-muted/40 border border-border p-4">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-sm font-body text-foreground">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-dream-primary hover:opacity-90 text-primary-foreground rounded-xl py-6 font-body font-medium gap-2 shadow-dream transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            {loading
              ? "Processing…"
              : selectedPlan === "annual"
              ? "Start Annual Plan – ₹999/yr"
                : "Start Monthly Plan – ₹99/mo"}
          </Button>

          <p className="text-center text-xs text-muted-foreground font-body">
            Cancel anytime · Secure payment via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
