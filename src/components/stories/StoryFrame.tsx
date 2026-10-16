import { CalendarPlus, Clock, Link2, MapPin } from "lucide-react";

export type StoryOverlay = {
  id: string;
  kind: "text" | "sticker";
  text: string;
  color: string;
  size: number; // rem
  x: number; // % of width
  y: number; // % of height
  style?: "plain" | "box" | "serif";
  sticker?: "time" | "location" | "booking" | "link";
};

export type StoryItem = {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  filter: string;
  crop: { scale: number; x: number; y: number };
  overlays: StoryOverlay[];
  link_url?: string | null;
  link_label?: string | null;
  expires_at?: string | null;
};

export const STORY_FILTERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "Normal", css: "none" },
  { id: "bw", label: "B/N", css: "grayscale(1)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.5)" },
  { id: "warm", label: "Cálido", css: "sepia(.35) saturate(1.3)" },
  { id: "cold", label: "Frío", css: "hue-rotate(-15deg) saturate(.85) brightness(1.05)" },
  { id: "punch", label: "Contraste", css: "contrast(1.35) saturate(1.2)" },
  { id: "fade", label: "Suave", css: "contrast(.85) brightness(1.1) saturate(.7)" },
];

export const filterCss = (id: string) => STORY_FILTERS.find(f => f.id === id)?.css ?? "none";

const STICKER_ICON = { time: Clock, location: MapPin, booking: CalendarPlus, link: Link2 };

export function OverlayView({ o }: { o: StoryOverlay }) {
  if (o.kind === "sticker") {
    const Icon = STICKER_ICON[o.sticker ?? "booking"];
    return <span className="story-sticker" style={{ fontSize: `${o.size}rem` }}><Icon />{o.text}</span>;
  }
  return (
    <span className={`story-text story-text--${o.style ?? "plain"}`} style={{ color: o.color, fontSize: `${o.size}rem` }}>
      {o.text}
    </span>
  );
}

/** Renders a story media full-size (never cropped unless admin zoomed) with filter + overlays. */
export function StoryFrame({ item, onVideoMeta, onVideoEnd, interactive = false }: {
  item: StoryItem;
  onVideoMeta?: (seconds: number) => void;
  onVideoEnd?: () => void;
  interactive?: boolean;
}) {
  const { scale = 1, x = 0, y = 0 } = item.crop || ({} as StoryItem["crop"]);
  const mediaStyle = { filter: filterCss(item.filter), transform: `translate(${x}%, ${y}%) scale(${scale})` };
  return (
    <div className="story-frame">
      {item.media_type === "video"
        ? <video className="story-frame__bg" src={item.media_url} muted playsInline autoPlay loop aria-hidden="true" />
        : <img className="story-frame__bg" src={item.media_url} alt="" aria-hidden="true" />}
      {item.media_type === "video" ? (
        <video className="story-frame__media" style={mediaStyle} src={item.media_url} autoPlay muted playsInline
          onLoadedMetadata={e => onVideoMeta?.(e.currentTarget.duration)} onEnded={onVideoEnd} loop={!onVideoEnd} />
      ) : (
        <img className="story-frame__media" style={mediaStyle} src={item.media_url} alt="Historia de DIEGCUTZ" />
      )}
      {!interactive && item.overlays?.map(o => (
        <div key={o.id} className="story-overlay" style={{ left: `${o.x}%`, top: `${o.y}%` }}><OverlayView o={o} /></div>
      ))}
    </div>
  );
}
