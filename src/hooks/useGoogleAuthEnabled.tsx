import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGoogleAuthEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "google_auth_enabled")
        .single();

      if (data) {
        setIsEnabled(data.value === true);
      }
      setLoading(false);
    };

    loadSetting();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("google-auth-setting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.google_auth_enabled",
        },
        (payload) => {
          setIsEnabled((payload.new as { value: boolean }).value === true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isGoogleAuthEnabled: isEnabled, loading };
};
