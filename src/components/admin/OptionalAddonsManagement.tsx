import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Plus } from "lucide-react";

type OptionalAddon = {
  id: string;
  name: string;
  price: number;
  coming_soon: boolean;
};

export const OptionalAddonsManagement = () => {
  const { toast } = useToast();
  const [addons, setAddons] = useState<OptionalAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAddon, setEditingAddon] = useState<OptionalAddon | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    coming_soon: false,
  });

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("optional_addons")
      .select("*")
      .order("name");

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los adicionales", variant: "destructive" });
      return;
    }

    setAddons((data || []) as OptionalAddon[]);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ name: "", price: 0, coming_soon: false });
  };

  const handleEdit = (addon: OptionalAddon) => {
    setEditingAddon(addon);
    setFormData({ name: addon.name, price: addon.price, coming_soon: addon.coming_soon });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    if (editingAddon) {
      const { error } = await supabase
        .from("optional_addons")
        .update(formData)
        .eq("id", editingAddon.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
        return;
      }

      toast({ title: "Adicional actualizado" });
    } else {
      const { error } = await supabase.from("optional_addons").insert(formData);

      if (error) {
        toast({ title: "Error", description: "No se pudo crear", variant: "destructive" });
        return;
      }

      toast({ title: "Adicional creado" });
    }

    setEditingAddon(null);
    setIsCreating(false);
    loadAddons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este adicional?")) return;

    const { error } = await supabase.from("optional_addons").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
      return;
    }

    toast({ title: "Adicional eliminado" });
    loadAddons();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Adicionales Opcionales</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Extras que aparecen al seleccionar packs (ej: Mascarilla)
            </p>
          </div>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Añadir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addons.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No hay adicionales registrados
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell className="font-medium">{addon.name}</TableCell>
                  <TableCell>{addon.price}€</TableCell>
                  <TableCell>
                    {addon.coming_soon ? (
                      <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                        Próximamente
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">
                        Activo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addon.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editingAddon || isCreating} onOpenChange={() => { setEditingAddon(null); setIsCreating(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon ? "Editar" : "Crear"} Adicional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Mascarilla facial"
              />
            </div>
            <div>
              <Label>Precio (€)</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addon_coming_soon"
                checked={formData.coming_soon}
                onCheckedChange={(checked) => setFormData({ ...formData, coming_soon: !!checked })}
              />
              <Label htmlFor="addon_coming_soon" className="cursor-pointer">
                Marcar como PRÓXIMAMENTE
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingAddon(null); setIsCreating(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
