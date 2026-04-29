import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Megaphone } from "lucide-react";

type MarqueeItem = {
  id: string;
  text: string;
  color: string;
  sort_order: number;
  is_active: boolean;
};

const COLOR_OPTIONS = [
  { key: "cyan", label: "Cyan", className: "text-neon-cyan", swatch: "bg-neon-cyan" },
  { key: "purple", label: "Purple", className: "text-neon-purple", swatch: "bg-neon-purple" },
  { key: "pink", label: "Pink", className: "text-neon-pink", swatch: "bg-neon-pink" },
  { key: "primary", label: "Primary", className: "text-primary", swatch: "bg-primary" },
  { key: "gold", label: "Gold", className: "text-[#D4AF37]", swatch: "bg-[#D4AF37]" },
  { key: "white", label: "White", className: "text-foreground", swatch: "bg-foreground" },
];

export const colorClassFor = (color: string) =>
  COLOR_OPTIONS.find((c) => c.key === color)?.className || "text-neon-cyan";

export const MarqueeManagement = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState("cyan");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marquee_items")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data as MarqueeItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!newText.trim()) return;
    const maxOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) : 0;
    const { error } = await supabase.from("marquee_items").insert({
      text: newText.trim(), color: newColor, sort_order: maxOrder + 1,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewText(""); setNewColor("cyan");
    toast({ title: "Elemento añadido" });
    load();
  };

  const updateItem = async (id: string, patch: Partial<MarqueeItem>) => {
    const { error } = await supabase.from("marquee_items").update(patch).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("marquee_items").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Eliminado" });
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx], b = items[target];
    await Promise.all([
      supabase.from("marquee_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("marquee_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-neon-cyan" /> Cinta Marquee de la Home
        </CardTitle>
        <CardDescription>
          Edita los textos que se muestran en la cinta neón animada de la página de inicio.
          Puedes cambiar el texto, color, orden y activar/desactivar cada elemento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Add new */}
        <div className="rounded-xl border-2 border-dashed border-neon-cyan/30 bg-neon-cyan/5 p-4 space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wider text-neon-cyan">Añadir nuevo elemento</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Ej: ★ NUEVA OFERTA"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
              className="flex-1"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <Button onClick={addItem} variant="neon">
              <Plus className="h-4 w-4 mr-1" /> Añadir
            </Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-muted-foreground py-6">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No hay elementos. Añade el primero arriba.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 flex flex-wrap items-center gap-2 transition ${item.is_active ? "border-border bg-card" : "border-muted bg-muted/20 opacity-60"}`}
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => move(idx, -1)}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === items.length - 1} onClick={() => move(idx, 1)}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <Input
                  value={item.text}
                  onChange={(e) => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, text: e.target.value } : i))}
                  onBlur={(e) => updateItem(item.id, { text: e.target.value })}
                  className={`flex-1 min-w-[160px] font-black uppercase tracking-widest ${colorClassFor(item.color)}`}
                  style={{ textShadow: "0 0 8px currentColor" }}
                />

                <select
                  value={item.color}
                  onChange={(e) => updateItem(item.id, { color: e.target.value })}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(v) => updateItem(item.id, { is_active: v })}
                  />
                  <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px]">
                    {item.is_active ? "Activo" : "Oculto"}
                  </Badge>
                </div>

                <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Live preview */}
        <div className="rounded-xl border-y border-neon-cyan/30 bg-background/40 backdrop-blur-sm py-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2">Vista previa</p>
          <div className="overflow-hidden">
            <div className="flex items-center gap-12 pr-12 whitespace-nowrap text-sm font-black uppercase tracking-[0.3em] animate-[marquee-scroll_30s_linear_infinite]">
              {items.filter((i) => i.is_active).map((i) => (
                <span key={i.id} className={colorClassFor(i.color)} style={{ textShadow: "0 0 12px currentColor" }}>
                  {i.text}
                </span>
              ))}
              {items.filter((i) => i.is_active).map((i) => (
                <span key={i.id + "-2"} className={colorClassFor(i.color)} style={{ textShadow: "0 0 12px currentColor" }}>
                  {i.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};