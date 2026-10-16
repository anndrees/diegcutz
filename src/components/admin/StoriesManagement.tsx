import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, Clock, Crop, Image as ImageIcon, Link2, Loader2, MapPin, Palette, Plus, Smartphone, Sticker, Trash2, Type, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STORY_FILTERS, StoryFrame, OverlayView, filterCss, type StoryItem, type StoryOverlay } from "@/components/stories/StoryFrame";
import "@/components/stories/stories.css";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

const COLORS = ["#ffffff", "#141414", "#e5372b", "#f2ede4", "#f5c542", "#25D366"];
const DURATIONS = [
  { id: "24h", label: "24 horas", hours: 24 },
  { id: "7d", label: "7 días", hours: 24 * 7 },
  { id: "forever", label: "Permanente", hours: 0 },
];
const uid = () => Math.random().toString(36).slice(2, 10);

type Tool = "filter" | "text" | "sticker" | "crop" | "link";

function StoryEditor({ file, onClose, onSaved }: { file: File; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [preview] = useState(() => URL.createObjectURL(file));
  const isVideo = file.type.startsWith("video");
  const [filter, setFilter] = useState("none");
  const [crop, setCrop] = useState({ scale: 1, x: 0, y: 0 });
  const [overlays, setOverlays] = useState<StoryOverlay[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("filter");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [duration, setDuration] = useState("24h");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);

  const activeO = overlays.find(o => o.id === active);
  const patch = (id: string, p: Partial<StoryOverlay>) => setOverlays(list => list.map(o => (o.id === id ? { ...o, ...p } : o)));

  const addText = () => {
    const o: StoryOverlay = { id: uid(), kind: "text", text: "Escribe aquí", color: "#ffffff", size: 1.8, x: 50, y: 40, style: "plain" };
    setOverlays(l => [...l, o]); setActive(o.id); setTool("text");
  };
  const addSticker = (sticker: StoryOverlay["sticker"]) => {
    const text = sticker === "time" ? new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : sticker === "location" ? "Monóvar" : sticker === "booking" ? "Reserva tu cita" : "Ver más";
    const o: StoryOverlay = { id: uid(), kind: "sticker", sticker, text, color: "#141414", size: 1, x: 50, y: 70 };
    setOverlays(l => [...l, o]); setActive(o.id);
    if (sticker === "booking" && !linkUrl) { setLinkUrl("/booking"); setLinkLabel("Reservar cita"); }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    patch(dragRef.current, {
      x: Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(95, Math.max(5, ((e.clientY - r.top) / r.height) * 100)),
    });
  };

  const save = async () => {
    setSaving(true);
    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const path = `stories/${Date.now()}-${uid()}.${ext}`;
    const up = await supabase.storage.from("homepage").upload(path, file, { contentType: file.type });
    if (up.error) { setSaving(false); toast({ title: "No se pudo subir", description: up.error.message, variant: "destructive" }); return; }
    const url = supabase.storage.from("homepage").getPublicUrl(path).data.publicUrl;
    const hours = DURATIONS.find(d => d.id === duration)!.hours;
    const { error } = await supabase.from("home_stories" as any).insert({
      media_url: url, media_type: isVideo ? "video" : "image", filter, crop, overlays,
      link_url: linkUrl.trim() || null, link_label: linkLabel.trim() || null,
      expires_at: hours ? new Date(Date.now() + hours * 3600_000).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast({ title: "Error al guardar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Historia publicada" });
    onSaved();
  };

  const item: StoryItem = { id: "draft", media_url: preview, media_type: isVideo ? "video" : "image", filter, crop, overlays };

  return (
    <div className="story-editor">
      <div className="story-editor__top">
        <button onClick={onClose} aria-label="Cancelar"><X /></button>
        <select value={duration} onChange={e => setDuration(e.target.value)} className="story-editor__chip" aria-label="Duración">
          {DURATIONS.map(d => <option key={d.id} value={d.id} style={{ color: "#141414" }}>{d.label}</option>)}
        </select>
        <button className="is-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Check />} Publicar</button>
      </div>

      <div ref={canvasRef} className="story-editor__canvas" onPointerMove={onPointerMove} onPointerUp={() => (dragRef.current = null)} onPointerLeave={() => (dragRef.current = null)} onClick={() => setActive(null)}>
        <StoryFrame item={item} interactive />
        {overlays.map(o => (
          <div key={o.id} className={`story-overlay ${active === o.id ? "is-active" : ""}`} style={{ left: `${o.x}%`, top: `${o.y}%` }}
            onPointerDown={e => { e.stopPropagation(); dragRef.current = o.id; setActive(o.id); if (o.kind === "text") setTool("text"); }}
            onClick={e => e.stopPropagation()}>
            <OverlayView o={o} />
          </div>
        ))}
      </div>

      <div className="story-editor__tools">
        <button className={tool === "filter" ? "is-on" : ""} onClick={() => setTool("filter")}><Palette />Filtros</button>
        <button className={tool === "text" ? "is-on" : ""} onClick={() => (activeO?.kind === "text" ? setTool("text") : addText())}><Type />Texto</button>
        <button className={tool === "sticker" ? "is-on" : ""} onClick={() => setTool("sticker")}><Sticker />Stickers</button>
        <button className={tool === "crop" ? "is-on" : ""} onClick={() => setTool("crop")}><Crop />Encuadre</button>
        <button className={tool === "link" ? "is-on" : ""} onClick={() => setTool("link")}><Link2 />Enlace</button>
      </div>

      <div className="story-editor__panel">
        {tool === "filter" && (
          <div className="story-filters">
            {STORY_FILTERS.map(f => (
              <button key={f.id} className={filter === f.id ? "is-on" : ""} onClick={() => setFilter(f.id)}>
                <span style={{ backgroundImage: isVideo ? undefined : `url(${preview})`, background: isVideo ? "hsl(var(--paper) / .2)" : undefined, filter: filterCss(f.id) }} />{f.label}
              </button>
            ))}
          </div>
        )}
        {tool === "text" && (activeO?.kind === "text" ? (
          <>
            <input type="text" value={activeO.text} onChange={e => patch(activeO.id, { text: e.target.value })} aria-label="Texto" autoFocus />
            <div className="story-editor__row">
              {(["plain", "box", "serif"] as const).map(st => (
                <button key={st} className={`story-editor__chip ${activeO.style === st ? "is-on" : ""}`} onClick={() => patch(activeO.id, { style: st })}>{st === "plain" ? "Clásico" : st === "box" ? "Etiqueta" : "Elegante"}</button>
              ))}
              <button className="story-editor__chip" onClick={addText}><Plus className="inline w-3 h-3" /> Otro</button>
              <button className="story-editor__chip" onClick={() => { setOverlays(l => l.filter(o => o.id !== activeO.id)); setActive(null); }}><Trash2 className="inline w-3 h-3" /> Quitar</button>
            </div>
            <div className="story-editor__row">{COLORS.map(c => <button key={c} aria-label={`Color ${c}`} className={`story-editor__swatch ${activeO.color === c ? "is-on" : ""}`} style={{ background: c }} onClick={() => patch(activeO.id, { color: c })} />)}</div>
            <label>Tamaño<input type="range" min={0.8} max={4} step={0.1} value={activeO.size} onChange={e => patch(activeO.id, { size: +e.target.value })} /></label>
            <small style={{ opacity: .6 }}>Arrastra el texto con el dedo para moverlo.</small>
          </>
        ) : <Button variant="secondary" onClick={addText}>Añadir texto</Button>)}
        {tool === "sticker" && (
          <>
            <div className="story-editor__row">
              <button className="story-editor__chip" onClick={() => addSticker("booking")}><CalendarPlus className="inline w-3 h-3" /> Reserva</button>
              <button className="story-editor__chip" onClick={() => addSticker("time")}><Clock className="inline w-3 h-3" /> Hora</button>
              <button className="story-editor__chip" onClick={() => addSticker("location")}><MapPin className="inline w-3 h-3" /> Ubicación</button>
              <button className="story-editor__chip" onClick={() => addSticker("link")}><Link2 className="inline w-3 h-3" /> Enlace</button>
            </div>
            {activeO?.kind === "sticker" && (
              <>
                <input type="text" value={activeO.text} onChange={e => patch(activeO.id, { text: e.target.value })} aria-label="Texto del sticker" />
                <label>Tamaño<input type="range" min={0.6} max={2.2} step={0.1} value={activeO.size} onChange={e => patch(activeO.id, { size: +e.target.value })} /></label>
                <button className="story-editor__chip" onClick={() => { setOverlays(l => l.filter(o => o.id !== activeO.id)); setActive(null); }}>Quitar sticker</button>
              </>
            )}
          </>
        )}
        {tool === "crop" && (
          <>
            <label>Zoom<input type="range" min={1} max={3} step={0.05} value={crop.scale} onChange={e => setCrop(c => ({ ...c, scale: +e.target.value }))} /></label>
            <label>Horizontal<input type="range" min={-50} max={50} value={crop.x} onChange={e => setCrop(c => ({ ...c, x: +e.target.value }))} /></label>
            <label>Vertical<input type="range" min={-50} max={50} value={crop.y} onChange={e => setCrop(c => ({ ...c, y: +e.target.value }))} /></label>
            <button className="story-editor__chip" onClick={() => setCrop({ scale: 1, x: 0, y: 0 })}>Restablecer</button>
          </>
        )}
        {tool === "link" && (
          <>
            <input type="text" placeholder="Enlace (ej. /booking o https://...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
            <input type="text" placeholder="Texto del botón (ej. Reservar cita)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} />
            <small style={{ opacity: .6 }}>Si lo dejas vacío, la historia muestra el botón "Reservar cita".</small>
          </>
        )}
      </div>
    </div>
  );
}

export function StoriesManagement() {
  const { toast } = useToast();
  const [stories, setStories] = useState<(StoryItem & { created_at: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const standalone = isStandalone();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("home_stories" as any).select("*").order("created_at", { ascending: false });
    setStories((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta historia?")) return;
    const { error } = await supabase.from("home_stories" as any).delete().eq("id", id);
    if (error) toast({ title: "No se pudo eliminar", variant: "destructive" });
    else setStories(s => s.filter(x => x.id !== id));
  };

  const expiry = (s: StoryItem) => {
    if (!s.expires_at) return "Permanente";
    const ms = new Date(s.expires_at).getTime() - Date.now();
    if (ms <= 0) return "Caducada";
    const h = Math.round(ms / 3600_000);
    return h < 48 ? `${h} h` : `${Math.round(h / 24)} días`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historias de la portada</CardTitle>
        <CardDescription>Las 3 fotos del estudio siempre aparecen juntas en la historia "Estudio". Las que subas aquí salen en "Novedades".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {standalone ? (
          <>
            <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} />
            <Button onClick={() => inputRef.current?.click()} className="w-full sm:w-auto"><ImageIcon className="mr-2 h-4 w-4" /> Nueva historia (foto o vídeo)</Button>
          </>
        ) : (
          <div className="flex gap-3 rounded-xl border border-border p-4">
            <Smartphone className="h-6 w-6 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-bold">Las historias se suben desde la app instalada</p>
              <p className="text-muted-foreground">Abre DIEGCUTZ desde el icono de tu móvil (la app instalada), entra al panel y sube la historia desde aquí. Desde la web solo puedes verlas y eliminarlas.</p>
            </div>
          </div>
        )}

        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no has subido historias.</p>
        ) : (
          <div className="story-admin-grid">
            {stories.map(s => (
              <div key={s.id} className="story-admin-tile">
                <StoryFrame item={s} />
                <div className="story-admin-tile__meta"><span>{expiry(s)}</span><button onClick={() => remove(s.id)} aria-label="Eliminar historia"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {file && <StoryEditor file={file} onClose={() => setFile(null)} onSaved={() => { setFile(null); load(); }} />}
    </Card>
  );
}
