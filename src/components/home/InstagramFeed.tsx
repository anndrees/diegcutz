import { useState, useEffect } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const INSTAGRAM_USERNAME = "diegcutzz";

// Instagram embed placeholders - Since Instagram API requires business account,
// we'll create an attractive placeholder that links to the profile
const InstagramPlaceholder = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <a
          key={i}
          href={`https://instagram.com/${INSTAGRAM_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square bg-gradient-to-br from-card to-background rounded-xl overflow-hidden border-2 border-primary/30 hover:border-neon-cyan/50 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-orange-400/20 opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Instagram className="h-12 w-12 mx-auto mb-2 text-neon-pink group-hover:scale-110 transition-transform" />
              <p className="text-xs text-muted-foreground group-hover:text-neon-cyan transition-colors">
                Ver en Instagram
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
};

export const InstagramFeed = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfEnabled();
  }, []);

  const checkIfEnabled = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "instagram_feed_enabled")
      .maybeSingle();

    if (data) {
      setIsEnabled(data.value === true);
    }
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-neon-pink/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
              INSTAGRAM
            </h2>
          </div>
          <p className="text-muted-foreground">
            Síguenos en{" "}
            <a
              href={`https://instagram.com/${INSTAGRAM_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-pink hover:underline font-bold"
            >
              @{INSTAGRAM_USERNAME}
            </a>
          </p>
        </div>

        {/* Feed Grid */}
        <InstagramPlaceholder />

        {/* CTA Button */}
        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-background transition-all duration-300 group"
            onClick={() => window.open(`https://instagram.com/${INSTAGRAM_USERNAME}`, "_blank")}
          >
            <Instagram className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Ver perfil completo
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
