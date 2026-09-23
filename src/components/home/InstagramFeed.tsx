import { useEffect, useState } from "react";
import { ArrowUpRight, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const USERNAME = "diegcutz";

export function InstagramFeed() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "instagram_feed_enabled").maybeSingle().then(({ data }) => {
      if (data) setEnabled(data.value === true);
    });
  }, []);
  if (!enabled) return null;

  return (
    <section className="instagram-editorial">
      <div className="instagram-editorial__number">05</div>
      <div className="instagram-editorial__copy">
        <p className="customer-kicker">DESDE EL ESTUDIO</p>
        <h2>El trabajo continúa<br />en <span>@{USERNAME}</span></h2>
        <p>Cortes recientes, procesos y referencias desde el día a día del estudio.</p>
        <a href={`https://instagram.com/${USERNAME}`} target="_blank" rel="noopener noreferrer">Seguir en Instagram <ArrowUpRight /></a>
      </div>
      <a href={`https://instagram.com/${USERNAME}`} target="_blank" rel="noopener noreferrer" className="instagram-editorial__tile">
        <Instagram /><span>ABRIR PERFIL</span><ArrowUpRight />
      </a>
    </section>
  );
}