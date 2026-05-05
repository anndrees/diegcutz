import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, ExternalLink, Loader2, AlertCircle, Check, Globe } from "lucide-react";

type Provider = "spotify" | "youtube" | "other";

function detectProvider(url: string): Provider {
  if (/spotify\.com|spotify:/i.test(url)) return "spotify";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return "other";
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i);
  return m ? m[1] : null;
}

type Meta = { title: string; thumbnail: string | null; author?: string };

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export const PlaylistPreview = ({ url }: { url: string }) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const provider = useMemo(() => detectProvider(url), [url]);
  const domain = useMemo(() => getDomain(url), [url]);

  useEffect(() => {
    let cancel = false;
    setMeta(null);
    setError(false);
    setConfirmed(false);
    if (!url || !domain) return;
    if (provider === "other") {
      // No oEmbed for unknown providers — show fallback immediately.
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        // YouTube: instant thumbnail from videoId
        if (provider === "youtube") {
          const id = getYoutubeId(url);
          if (id && !cancel) {
            setMeta({ title: "Video de YouTube", thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` });
          }
        }
        // Both: enrich via noembed (CORS-friendly oEmbed proxy)
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("oembed failed");
        const data = await res.json();
        if (cancel) return;
        if (data.error) {
          if (provider !== "youtube") setError(true);
        } else {
          setMeta({
            title: data.title || (provider === "spotify" ? "Playlist de Spotify" : "Video de YouTube"),
            thumbnail: data.thumbnail_url || null,
            author: data.author_name,
          });
        }
      } catch {
        if (!cancel && provider !== "youtube") setError(true);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    const t = setTimeout(run, 400); // debounce typing
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [url, provider, domain]);

  if (!url || !domain) return null;

  const accent =
    provider === "spotify" ? "#1DB954" :
    provider === "youtube" ? "#FF0000" :
    "hsl(190 95% 50%)"; // neon cyan fallback
  const providerLabel =
    provider === "spotify" ? "Spotify" :
    provider === "youtube" ? "YouTube" :
    domain;
  const showFallback = provider === "other" || (error && !meta);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={url}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="mt-3 rounded-xl border bg-card/60 backdrop-blur-md overflow-hidden"
        style={{ borderColor: `${accent}55`, boxShadow: `0 0 30px ${accent}33` }}
      >
        <div className="flex items-stretch gap-3 p-3">
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}66` }}
          >
            {meta?.thumbnail ? (
              <img
                src={meta.thumbnail}
                alt={meta.title}
                className="w-full h-full object-cover"
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
            ) : loading ? (
              <Loader2 className="w-6 h-6 animate-spin opacity-60" />
            ) : showFallback ? (
              <Globe className="w-6 h-6 opacity-60" />
            ) : (
              <Music2 className="w-6 h-6 opacity-60" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${accent}22`, color: accent }}
              >
                {providerLabel}
              </span>
              {loading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
              {confirmed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neon-cyan">
                  <Check className="w-3 h-3" /> Confirmada
                </span>
              )}
            </div>
            <p className="font-bold text-sm sm:text-base truncate" style={{ textShadow: `0 0 12px ${accent}88` }}>
              {meta?.title
                || (loading ? "Cargando preview…" : showFallback ? domain : "—")}
            </p>
            {meta?.author ? (
              <p className="text-xs text-muted-foreground truncate">{meta.author}</p>
            ) : showFallback ? (
              <p className="text-xs text-muted-foreground">
                {error ? "No se pudo cargar la preview." : "Enlace externo."} Confírmalo si es el correcto.
              </p>
            ) : null}
            <div className="flex items-center gap-3 mt-1.5">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs hover:underline"
                style={{ color: accent }}
              >
                Abrir enlace <ExternalLink className="w-3 h-3" />
              </a>
              {!confirmed && (showFallback || meta) && !loading && (
                <button
                  type="button"
                  onClick={() => setConfirmed(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold rounded-md px-2 py-0.5 border transition-colors"
                  style={{ borderColor: `${accent}66`, color: accent, background: `${accent}11` }}
                >
                  <Check className="w-3 h-3" /> Sí, es esta
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaylistPreview;