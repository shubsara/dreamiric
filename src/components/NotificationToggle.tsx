import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer as ArrayBuffer;
}

type Status = "idle" | "loading" | "subscribed" | "denied" | "unsupported";

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("idle");
  const { toast } = useToast();

  // Check if already subscribed on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) setStatus("subscribed");
    });
  }, []);

  const subscribe = useCallback(async () => {
    setStatus("loading");
    try {
      // 1. Get VAPID public key from edge function
      const { data, error } = await supabase.functions.invoke("get-vapid-key");
      if (error || !data?.publicKey) {
        throw new Error("Push notifications aren't configured yet. Please add VAPID keys.");
      }

      // 2. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast({
          title: "Notifications blocked",
          description: "Enable notifications in your browser settings to get morning reminders.",
          variant: "destructive",
        });
        return;
      }

      // 3. Subscribe via service worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      // 4. Save subscription to backend
      const subJson = subscription.toJSON();
      const { error: saveError } = await supabase.functions.invoke("save-push-subscription", {
        body: {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        },
      });

      if (saveError) throw saveError;

      setStatus("subscribed");
      toast({
        title: "Morning reminders enabled 🌙",
        description: "You'll receive a gentle nudge each morning at 7 AM to record your dreams.",
      });
    } catch (err) {
      console.error("Subscribe error:", err);
      setStatus("idle");
      toast({
        title: "Couldn't enable notifications",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const unsubscribe = useCallback(async () => {
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await supabase.functions.invoke("save-push-subscription", {
          method: "DELETE",
          body: { endpoint },
        });
      }

      setStatus("idle");
      toast({
        title: "Morning reminders off",
        description: "You won't receive dream reminders anymore.",
      });
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setStatus("subscribed");
      toast({
        title: "Couldn't disable notifications",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  if (status === "unsupported") return null;

  if (status === "denied") {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs font-body text-destructive/80 flex items-start gap-2">
        <BellOff className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>Notifications blocked. Enable them in browser settings.</span>
      </div>
    );
  }

  const isLoading = status === "loading";
  const isSubscribed = status === "subscribed";

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all border ${
        isSubscribed
          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
      } disabled:opacity-50`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="flex-1 text-left">
        {isLoading
          ? "Setting up..."
          : isSubscribed
          ? "Morning reminders on"
          : "Enable reminders"}
      </span>
      {isSubscribed && (
        <span className="text-[10px] text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded-full">
          7 AM
        </span>
      )}
    </button>
  );
}
