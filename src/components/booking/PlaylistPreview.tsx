import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, ExternalLink, Loader2, AlertCircle } from "lucide-react";

type Provider = "spotify" | "youtube" | null;

function detectProvider(url: string): Provider {
  if (!url) return null;
  if (/spotify\.com|spotify:/i.test(url)) return "spotify";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return null;
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i);
  return m ? m[1] : null;
}

type Meta = { title: string; thumbnail: string | null; author?: string };

export const PlaylistPreview = ({ url }: { url: string }) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const provider = detectProvider(url);

  useEffect(() => {
    let cancel = false;
    setMeta(null);
    setError(false);
    if (!provider || !url) return;

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
  }, [url, provider]);

  if (!provider) return null;

  const accent = provider === "spotify" ? "#1DB954" : "#FF0000";

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
            ) : error ? (
              <AlertCircle className="w-6 h-6 opacity-60" />
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
                {provider === "spotify" ? "Spotify" : "YouTube"}
              </span>
              {loading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
            </div>
            <p className="font-bold text-sm sm:text-base truncate" style={{ textShadow: `0 0 12px ${accent}88` }}>
              {meta?.title || (loading ? "Cargando preview…" : error ? "No se pudo cargar la preview" : "—")}
            </p>
            {meta?.author && <p className="text-xs text-muted-foreground truncate">{meta.author}</p>}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
              style={{ color: accent }}
            >
              Abrir enlace <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaylistPreview;