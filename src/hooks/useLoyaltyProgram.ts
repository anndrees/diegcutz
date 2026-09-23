import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useLoyaltyProgram = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "loyalty_program_enabled")
        .maybeSingle();
      setEnabled(data?.value === true);
      setLoading(false);
    };

    load();
    const channel = supabase
      .channel("loyalty-program-setting")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.loyalty_program_enabled" },
        load,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { enabled, loading };
};