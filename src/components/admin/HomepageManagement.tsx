import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Image as ImageIcon, Upload, Trash2, Sparkles, Palette, Home as HomeIcon } from "lucide-react";
import defaultHero from "@/assets/hero-barber.jpg";

type HomeSettings = {
  home_hero_image_url: string;
  home_hero_color_filter: boolean;
  home_hero_overlay_intensity: number;
  home_show_floating_particles: boolean;
  home_hero_title: string;
  home_hero_subtitle: string;
};

const DEFAULTS: HomeSettings = {
  home_hero_image_url: "",
  home_hero_color_filter: false,
  home_hero_overlay_intensity: 60,
  home_show_floating_particles: true,
  home_hero_title: "",
  home_hero_subtitle: "",
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
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande", description: "Máximo 8MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `hero-${Date.now()}.${ext}`;
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
    await save("home_hero_image_url", data.publicUrl);
    setUploading(false);
  };

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

      {/* Hero image */}
      <Card className="bg-card/40 backdrop-blur-xl border-neon-cyan/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <ImageIcon className="h-5 w-5" />
            Imagen de fondo (Hero)
          </CardTitle>
          <CardDescription>
            Imagen que aparece en la parte superior de la página principal.
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
                accept="image/*"
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
                  {uploading ? "Subiendo..." : "Subir nueva imagen"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">JPG / PNG / WEBP · Máx 8MB</p>
          </div>

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

      {/* Hero text */}
      <Card className="bg-card/40 backdrop-blur-xl border-neon-purple/30">
        <CardHeader>
          <CardTitle className="text-cyan-400">Textos del Hero</CardTitle>
          <CardDescription>Personaliza el título y subtítulo principal (déjalo vacío para usar los por defecto).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título principal</Label>
            <Input
              value={settings.home_hero_title}
              onChange={(e) => setSettings((p) => ({ ...p, home_hero_title: e.target.value }))}
              onBlur={(e) => save("home_hero_title", e.target.value)}
              placeholder="DIEGCUTZ"
              className="bg-background/50 border-neon-purple/30"
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={settings.home_hero_subtitle}
              onChange={(e) => setSettings((p) => ({ ...p, home_hero_subtitle: e.target.value }))}
              onBlur={(e) => save("home_hero_subtitle", e.target.value)}
              placeholder="Cortes de calidad sin gastarte un dineral"
              className="bg-background/50 border-neon-purple/30"
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