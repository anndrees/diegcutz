import { useEffect, useState } from "react";
import { Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import "./mobile-app.css";

const WHATSAPP_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884";

type Props = {
  /** When omitted, the Instagram toggle is read from app_settings (same source as the homepage). */
  igEnabled?: boolean;
};

export function MobileTopHeader({ igEnabled }: Props) {
  const [ig, setIg] = useState<boolean>(igEnabled ?? true);

  useEffect(() => {
    if (igEnabled !== undefined) {
      setIg(igEnabled);
      return;
    }
    let alive = true;
    supabase
      .from("app_settings")
      .select("key,value")
      .eq("key", "instagram_feed_enabled")
      .then(({ data }) => {
        if (alive && Array.isArray(data) && data.length) setIg((data[0] as any).value === true);
      });
    return () => {
      alive = false;
    };
  }, [igEnabled]);

  return (
    <header className="mh-top">
      <span className="mh-top__brand">DIEGCUTZ<span>.</span></span>
      <div className="mh-top__actions">
        {ig && <a className="mh-icon" href="https://instagram.com/diegcutz" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a>}
        <a className="mh-icon" href="https://wa.me/34641637576" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="24" height="24"><path d={WHATSAPP_PATH} /></svg>
        </a>
      </div>
    </header>
  );
}
