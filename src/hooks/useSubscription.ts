import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Subscription check error:", error);
        setIsPro(false);
      } else if (data) {
        const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
        setIsPro(!isExpired);
      } else {
        setIsPro(false);
      }
    } catch {
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return { isPro, loading, refetch: checkSubscription };
}
