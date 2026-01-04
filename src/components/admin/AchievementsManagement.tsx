import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Trophy, Award } from "lucide-react";
import { AchievementIcon } from "./AchievementIcon";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger_type: string;
  trigger_value: number | null;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_TYPES = [
  { value: "manual", label: "Manual (Admin otorga)", requiresValue: false },
  { value: "first_booking", label: "Primera reserva", requiresValue: false },
  { value: "bookings_count", label: "Número de citas", requiresValue: true },
  { value: "rating_given", label: "Valoraciones dadas", requiresValue: true },
  { value: "giveaway_won", label: "Sorteos ganados", requiresValue: true },
  { value: "early_booking", label: "Cita madrugadora (<10:00)", requiresValue: false },
  { value: "late_booking", label: "Cita nocturna (>=20:00)", requiresValue: false },
  { value: "weekend_booking", label: "Cita en fin de semana", requiresValue: false },
  { value: "playlist_added", label: "Añadió playlist", requiresValue: false },
];

const ICONS = [
  "trophy", "award", "medal", "crown", "star", "heart", "gem", "sparkles",
  "baby", "repeat", "clover", "sunrise", "moon", "calendar-days", "music",
  "badge", "share-2", "message-square-star", "zap", "flame", "target"
];

export const AchievementsManagement = () => {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "trophy",
    trigger_type: "manual",
    trigger_value: "",
    is_active: true,
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los logros", variant: "destructive" });
    } else {
      setAchievements(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingAchievement(null);
    setForm({
      name: "",
      description: "",
      icon: "trophy",
      trigger_type: "manual",
      trigger_value: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setForm({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      trigger_type: achievement.trigger_type,
      trigger_value: achievement.trigger_value?.toString() || "",
      is_active: achievement.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({ title: "Error", description: "Nombre y descripción son requeridos", variant: "destructive" });
      return;
    }

    const triggerType = TRIGGER_TYPES.find(t => t.value === form.trigger_type);
    const triggerValue = triggerType?.requiresValue ? parseInt(form.trigger_value) || null : null;

    const achievementData = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      trigger_type: form.trigger_type,
      trigger_value: triggerValue,
      is_active: form.is_active,
    };

    if (editingAchievement) {
      const { error } = await supabase
        .from("achievements")
        .update(achievementData)
        .eq("id", editingAchievement.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el logro", variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Logro actualizado" });
    } else {
      const { error } = await supabase
        .from("achievements")
        .insert(achievementData);

      if (error) {
        toast({ title: "Error", description: "No se pudo crear el logro", variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Logro creado" });
    }

    setDialogOpen(false);
    loadAchievements();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el logro", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Logro eliminado" });
    setDeleteConfirm(null);
    loadAchievements();
  };

  const toggleActive = async (achievement: Achievement) => {
    const { error } = await supabase
      .from("achievements")
      .update({ is_active: !achievement.is_active })
      .eq("id", achievement.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      return;
    }

    loadAchievements();
  };

  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === form.trigger_type);

  if (loading) {
    return <div className="p-8 text-center">Cargando logros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-neon-cyan" />
            Gestión de Logros
          </h2>
          <p className="text-muted-foreground">Crea y administra los logros del sistema de gamificación</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-neon-purple hover:bg-neon-purple/80">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Logro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`relative transition-all ${!achievement.is_active ? 'opacity-50' : ''}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple">
                    <AchievementIcon icon={achievement.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{achievement.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {TRIGGER_TYPES.find(t => t.value === achievement.trigger_type)?.label}
                      {achievement.trigger_value && ` (${achievement.trigger_value})`}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={achievement.is_active}
                  onCheckedChange={() => toggleActive(achievement)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(achievement)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(achievement.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay logros creados</p>
          <p className="text-sm">Crea el primer logro para gamificar la experiencia</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? "Editar Logro" : "Nuevo Logro"}
            </DialogTitle>
            <DialogDescription>
              {editingAchievement 
                ? "Modifica los detalles del logro"
                : "Crea un nuevo logro para los clientes"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Cliente VIP"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Reconocido por su fidelidad"
              />
            </div>

            <div>
              <Label>Icono</Label>
              <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        <AchievementIcon icon={icon} className="h-4 w-4" />
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de activación</Label>
              <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTrigger?.requiresValue && (
              <div>
                <Label>Valor requerido</Label>
                <Input
                  type="number"
                  value={form.trigger_value}
                  onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
                  placeholder="Ej: 10"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Logro activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-neon-purple hover:bg-neon-purple/80">
              {editingAchievement ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Eliminar logro"
        description="¿Estás seguro de que quieres eliminar este logro? Se quitará de todos los usuarios que lo tengan."
        confirmText="Eliminar"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        variant="destructive"
      />
    </div>
  );
};
