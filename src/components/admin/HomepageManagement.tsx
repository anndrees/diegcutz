import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Image as ImageIcon, Upload, Trash2, Sparkles, Palette, Home as HomeIcon, RotateCcw, ArrowUp, ArrowDown, Film, Eye, EyeOff } from "lucide-react";
import defaultHero from "@/assets/hero-barber.jpg";

type HomeSettings = {
  home_hero_image_url: string;
  home_hero_color_filter: boolean;
  home_hero_overlay_intensity: number;
  home_show_floating_particles: boolean;
  home_hero_title: string;
  home_hero_subtitle: string;
  home_hero_slides: HomeMediaSlide[];
};

type HomeMediaSlide = { id: string; url: string; type: "image" | "video"; order: number; active: boolean };

const DEFAULTS: HomeSettings = {
  home_hero_image_url: "",
  home_hero_color_filter: false,
  home_hero_overlay_intensity: 60,
  home_show_floating_particles: true,
  home_hero_title: "",
  home_hero_subtitle: "",
  home_hero_slides: [],
};

export const HomepageManagement = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<HomeSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key, value");
    const next = { ...DEFAULTS };
    data?.forEach((row: any) => {
      if (row.key in next) {
        (next as any)[row.key] = row.value;
      }
    });
    setSettings(next);
    setLoading(false);
  };

  const save = async (key: keyof HomeSettings, value: any) => {
    setSettings((p) => ({ ...p, [key]: value }));
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: "Cambios aplicados a la página principal." });
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const limit = isVideo ? 40 : 10;
    if ((!file.type.startsWith("image/") && !isVideo) || file.size > limit * 1024 * 1024) {
      toast({ title: "Archivo no compatible", description: `Usa una foto (máx. 10 MB) o vídeo (máx. 40 MB).`, variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `carousel-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("homepage").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      toast({ title: "Error subiendo", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("homepage").getPublicUrl(path);
    const next = [...settings.home_hero_slides, { id: crypto.randomUUID(), url: data.publicUrl, type: isVideo ? "video" as const : "image" as const, order: settings.home_hero_slides.length, active: true }];
    await save("home_hero_slides", next);
    setUploading(false);
  };

  const updateSlides = async (next: HomeMediaSlide[]) => save("home_hero_slides", next.map((slide, order) => ({ ...slide, order })));
  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= settings.home_hero_slides.length) return;
    const next = [...settings.home_hero_slides];
    [next[index], next[target]] = [next[target], next[index]];
    void updateSlides(next);
  };
  const removeSlide = async (id: string) => updateSlides(settings.home_hero_slides.filter(slide => slide.id !== id));

  const removeImage = async () => {
    await save("home_hero_image_url", "");
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-neon-purple/30 bg-card/40 backdrop-blur-xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 via-transparent to-neon-cyan/10 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="p-3 rounded-xl bg-neon-purple/20 border border-neon-purple/40">
            <HomeIcon className="h-6 w-6 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] uppercase tracking-wide">
              Página principal
            </h2>
            <p className="text-sm text-muted-foreground">
              Personaliza el aspecto y contenido del Home.
            </p>
          </div>
        </div>
      </div>

      {/* Hero media */}
      <Card className="bg-card/40 backdrop-blur-xl border-neon-cyan/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <ImageIcon className="h-5 w-5" />
            Carrusel de portada
          </CardTitle>
          <CardDescription>
            Fotos y vídeos que rotan automáticamente en la página principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(() => {
            const isCustom = !!settings.home_hero_image_url;
            const src = settings.home_hero_image_url || defaultHero;
            return (
              <div className="relative rounded-xl overflow-hidden border border-neon-purple/30 group">
                <img
                  src={src}
                  alt={isCustom ? "Imagen actual del Hero" : "Imagen por defecto del Hero"}
                  className="w-full h-64 object-cover"
                  style={
                    settings.home_hero_color_filter
                      ? {
                          filter:
                            "hue-rotate(220deg) saturate(1.3) contrast(1.05) brightness(0.85)",
                        }
                      : undefined
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                {/* Live overlay preview matching Home darkening */}
                <div
                  className="absolute inset-0 bg-background pointer-events-none"
                  style={{ opacity: settings.home_hero_overlay_intensity / 100 }}
                />
                {isCustom && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                )}
                <div className="absolute bottom-3 left-3 flex gap-2 items-center">
                  <span className="px-3 py-1 rounded-full bg-background/70 backdrop-blur text-xs text-cyan-400 border border-cyan-400/30">
                    {isCustom ? "Imagen actual personalizada" : "Imagen por defecto"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-background/70 backdrop-blur text-xs text-neon-pink border border-neon-pink/30">
                    {settings.home_hero_color_filter ? "Filtro neón ON" : "Sin filtro"}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap gap-3 items-center">
            <label>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              <Button
                asChild
                disabled={uploading}
                className="bg-neon-purple hover:bg-neon-purple/80 cursor-pointer"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Subiendo..." : "Añadir foto o vídeo"}
                </span>
              </Button>
            </label>
            <Button
              variant="outline"
              onClick={removeImage}
              disabled={!settings.home_hero_image_url}
              className="border-neon-cyan/40 text-cyan-400 hover:bg-neon-cyan/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar imagen por defecto
            </Button>
            <p className="text-xs text-muted-foreground">Fotos hasta 10 MB · Vídeos hasta 40 MB</p>
          </div>

          {settings.home_hero_slides.length > 0 && (
            <div className="grid gap-3">
              {settings.home_hero_slides.map((slide, index) => (
                <div key={slide.id} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-xl border border-border bg-background/40 p-2">
                  <div className="h-14 overflow-hidden rounded-lg bg-muted">
                    {slide.type === "video" ? <video src={slide.url} muted className="h-full w-full object-cover" /> : <img src={slide.url} alt="Vista previa" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-semibold">{slide.type === "video" ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />} Escena {index + 1}</p><p className="truncate text-xs text-muted-foreground">{slide.active ? "Visible" : "Oculta"}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveSlide(index, -1)} disabled={index === 0} aria-label="Subir posición"><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveSlide(index, 1)} disabled={index === settings.home_hero_slides.length - 1} aria-label="Bajar posición"><ArrowDown /></Button>
                    <Button variant="ghost" size="icon" onClick={() => updateSlides(settings.home_hero_slides.map(item => item.id === slide.id ? { ...item, active: !item.active } : item))} aria-label={slide.active ? "Ocultar" : "Mostrar"}>{slide.active ? <Eye /> : <EyeOff />}</Button>
                    <Button variant="ghost" size="icon" onClick={() => removeSlide(slide.id)} aria-label="Eliminar"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="bg-neon-purple/20" />

          {/* Color filter toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-background/40 border border-neon-pink/20">
            <div className="flex-1">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Palette className="h-4 w-4 text-neon-pink" />
                Aplicar filtro de colores
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tinta la imagen con tonos rosa/morado/azul neón para que combine con el resto de la web.
                Desactívalo si la imagen ya tiene esos colores.
              </p>
            </div>
            <Switch
              checked={settings.home_hero_color_filter}
              onCheckedChange={(v) => save("home_hero_color_filter", v)}
            />
          </div>

          {/* Overlay intensity */}
          <div className="space-y-2 p-4 rounded-xl bg-background/40 border border-neon-cyan/20">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neon-cyan" />
                Oscurecimiento del fondo
              </Label>
              <span className="text-sm font-mono text-cyan-400">
                {settings.home_hero_overlay_intensity}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.home_hero_overlay_intensity}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  home_hero_overlay_intensity: parseInt(e.target.value),
                }))
              }
              onMouseUp={(e) =>
                save("home_hero_overlay_intensity", parseInt((e.target as HTMLInputElement).value))
              }
              onTouchEnd={(e) =>
                save("home_hero_overlay_intensity", parseInt((e.target as HTMLInputElement).value))
              }
              className="w-full accent-[hsl(var(--neon-cyan))]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual switches */}
      <Card className="bg-card/40 backdrop-blur-xl border-neon-pink/30">
        <CardHeader>
          <CardTitle className="text-cyan-400">Efectos visuales</CardTitle>
          <CardDescription>Activa o desactiva elementos decorativos del Home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
            <div>
              <Label className="text-base">Partículas flotantes</Label>
              <p className="text-xs text-muted-foreground">Pequeñas partículas neón animadas en el hero.</p>
            </div>
            <Switch
              checked={settings.home_show_floating_particles}
              onCheckedChange={(v) => save("home_show_floating_particles", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomepageManagement;