import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Plus, Trophy, Users, Ban, Shuffle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Giveaway = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  prize: string;
  start_date: string;
  end_date: string;
  is_finished: boolean;
  winner_id: string | null;
  winner_name: string | null;
  winner_username: string | null;
  excluded_user_ids: string[];
  created_at: string;
};

type Participant = {
  id: string;
  user_id: string;
  profile: {
    full_name: string;
    username: string;
  } | null;
};

type Profile = {
  id: string;
  full_name: string;
  username: string;
};

export const GiveawaysManagement = () => {
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showParticipants, setShowParticipants] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showExcludeDialog, setShowExcludeDialog] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [showReselectDialog, setShowReselectDialog] = useState<Giveaway | null>(null);
  const [excludePreviousWinner, setExcludePreviousWinner] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    prize: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadGiveaways();
  }, []);

  const loadGiveaways = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los sorteos", variant: "destructive" });
      return;
    }

    setGiveaways((data || []) as Giveaway[]);
  };

  const loadParticipants = async (giveawayId: string) => {
    const { data } = await supabase
      .from("giveaway_participants")
      .select(`
        id,
        user_id,
        profile:profiles(full_name, username)
      `)
      .eq("giveaway_id", giveawayId);

    if (data) {
      const formatted = data.map(p => ({
        ...p,
        profile: Array.isArray(p.profile) ? p.profile[0] : p.profile,
      })) as Participant[];
      setParticipants(formatted);
    }
    setShowParticipants(giveawayId);
  };

  const loadAllUsers = async (giveaway: Giveaway) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .order("full_name");

    if (data) {
      setAllUsers(data as Profile[]);
      setExcludedIds(giveaway.excluded_user_ids || []);
      setShowExcludeDialog(giveaway.id);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: "",
      description: "",
      requirements: "",
      prize: "",
      start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleEdit = (giveaway: Giveaway) => {
    setEditingGiveaway(giveaway);
    setFormData({
      title: giveaway.title,
      description: giveaway.description || "",
      requirements: giveaway.requirements || "",
      prize: giveaway.prize,
      start_date: giveaway.start_date.slice(0, 16),
      end_date: giveaway.end_date.slice(0, 16),
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.prize || !formData.start_date || !formData.end_date) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      requirements: formData.requirements || null,
      prize: formData.prize,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };

    if (editingGiveaway) {
      const { error } = await supabase
        .from("giveaways")
        .update(payload)
        .eq("id", editingGiveaway.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el sorteo", variant: "destructive" });
        return;
      }

      await supabase.from("admin_action_logs").insert({
        action_type: "UPDATE_GIVEAWAY",
        description: `Actualizó el sorteo "${formData.title}"`,
      });

      toast({ title: "Sorteo actualizado", description: "Los cambios se guardaron correctamente" });
    } else {
      const { error } = await supabase.from("giveaways").insert(payload);

      if (error) {
        toast({ title: "Error", description: "No se pudo crear el sorteo", variant: "destructive" });
        return;
      }

      await supabase.from("admin_action_logs").insert({
        action_type: "CREATE_GIVEAWAY",
        description: `Creó el sorteo "${formData.title}"`,
      });

      toast({ title: "Sorteo creado", description: "El sorteo se creó correctamente" });
    }

    setEditingGiveaway(null);
    setIsCreating(false);
    loadGiveaways();
  };

  const handleDelete = async (giveaway: Giveaway) => {
    if (!confirm("¿Seguro que quieres eliminar este sorteo?")) return;

    const { error } = await supabase.from("giveaways").delete().eq("id", giveaway.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el sorteo", variant: "destructive" });
      return;
    }

    await supabase.from("admin_action_logs").insert({
      action_type: "DELETE_GIVEAWAY",
      description: `Eliminó el sorteo "${giveaway.title}"`,
    });

    toast({ title: "Sorteo eliminado" });
    loadGiveaways();
  };

  const handleFinish = async (giveaway: Giveaway) => {
    if (!confirm("¿Marcar este sorteo como finalizado?")) return;

    const { error } = await supabase
      .from("giveaways")
      .update({ is_finished: true })
      .eq("id", giveaway.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo finalizar el sorteo", variant: "destructive" });
      return;
    }

    await supabase.from("admin_action_logs").insert({
      action_type: "FINISH_GIVEAWAY",
      description: `Finalizó el sorteo "${giveaway.title}"`,
    });

    toast({ title: "Sorteo finalizado" });
    loadGiveaways();
  };

  const handleSelectWinner = async (giveaway: Giveaway, additionalExclusions: string[] = []) => {
    // Get eligible participants (not excluded)
    const { data: participants } = await supabase
      .from("giveaway_participants")
      .select("user_id, profile:profiles(full_name, username)")
      .eq("giveaway_id", giveaway.id);

    if (!participants || participants.length === 0) {
      toast({ title: "Error", description: "No hay participantes en este sorteo", variant: "destructive" });
      return;
    }

    const allExclusions = [...(giveaway.excluded_user_ids || []), ...additionalExclusions];
    const eligibleParticipants = participants.filter(
      p => !allExclusions.includes(p.user_id)
    );

    if (eligibleParticipants.length === 0) {
      toast({ title: "Error", description: "No hay participantes elegibles", variant: "destructive" });
      return;
    }

    // Select random winner
    const winner = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
    const winnerProfile = Array.isArray(winner.profile) ? winner.profile[0] : winner.profile;

    const { error } = await supabase
      .from("giveaways")
      .update({
        winner_id: winner.user_id,
        winner_name: winnerProfile?.full_name || "Usuario",
        winner_username: winnerProfile?.username || null,
        is_finished: true,
        excluded_user_ids: allExclusions.length > 0 ? allExclusions : giveaway.excluded_user_ids,
      })
      .eq("id", giveaway.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo seleccionar el ganador", variant: "destructive" });
      return;
    }

    await supabase.from("admin_action_logs").insert({
      action_type: "SELECT_GIVEAWAY_WINNER",
      description: `Seleccionó a ${winnerProfile?.full_name} (@${winnerProfile?.username}) como ganador del sorteo "${giveaway.title}"`,
      target_user_id: winner.user_id,
      target_user_name: winnerProfile?.full_name,
    });

    toast({
      title: "🎉 ¡Ganador seleccionado!",
      description: `${winnerProfile?.full_name} (@${winnerProfile?.username}) ha ganado el sorteo`,
    });

    loadGiveaways();
  };

  const handleReselectWinner = async () => {
    if (!showReselectDialog) return;

    const additionalExclusions: string[] = [];
    if (excludePreviousWinner && showReselectDialog.winner_id) {
      additionalExclusions.push(showReselectDialog.winner_id);
    }

    await handleSelectWinner(showReselectDialog, additionalExclusions);
    setShowReselectDialog(null);
    setExcludePreviousWinner(true);
  };

  const handleSaveExclusions = async () => {
    if (!showExcludeDialog) return;

    const { error } = await supabase
      .from("giveaways")
      .update({ excluded_user_ids: excludedIds })
      .eq("id", showExcludeDialog);

    if (error) {
      toast({ title: "Error", description: "No se pudieron guardar las exclusiones", variant: "destructive" });
      return;
    }

    toast({ title: "Exclusiones guardadas" });
    setShowExcludeDialog(null);
    loadGiveaways();
  };

  const getStatus = (giveaway: Giveaway) => {
    if (giveaway.is_finished) return { label: "Finalizado", variant: "secondary" as const };
    const now = new Date();
    const start = new Date(giveaway.start_date);
    const end = new Date(giveaway.end_date);
    if (now < start) return { label: "Próximo", variant: "outline" as const };
    if (now > end) return { label: "Terminado", variant: "destructive" as const };
    return { label: "Activo", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Sorteos</CardTitle>
          <Button onClick={handleCreate} variant="neon">
            <Plus className="mr-2 h-4 w-4" />
            Crear Sorteo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {giveaways.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay sorteos registrados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ganador</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giveaways.map((giveaway) => {
                const status = getStatus(giveaway);
                return (
                  <TableRow key={giveaway.id}>
                    <TableCell className="font-medium">{giveaway.title}</TableCell>
                    <TableCell>{giveaway.prize}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p>{format(new Date(giveaway.start_date), "d MMM", { locale: es })}</p>
                        <p className="text-muted-foreground">
                          → {format(new Date(giveaway.end_date), "d MMM", { locale: es })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {giveaway.winner_id ? (
                        <Link 
                          to={`/admin/client/${giveaway.winner_id}`} 
                          className="text-neon-cyan font-bold hover:underline flex items-center gap-1"
                        >
                          🏆 {giveaway.winner_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => loadParticipants(giveaway.id)} title="Participantes">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => loadAllUsers(giveaway)} title="Excluir usuarios">
                        <Ban className="h-4 w-4" />
                      </Button>
                      {!giveaway.winner_id && (
                        <Button variant="ghost" size="icon" onClick={() => handleSelectWinner(giveaway)} title="Sortear ganador">
                          <Shuffle className="h-4 w-4 text-neon-cyan" />
                        </Button>
                      )}
                      {giveaway.winner_id && (
                        <Button variant="ghost" size="icon" onClick={() => setShowReselectDialog(giveaway)} title="Reelegir ganador">
                          <RotateCcw className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      {!giveaway.is_finished && !giveaway.winner_id && (
                        <Button variant="ghost" size="icon" onClick={() => handleFinish(giveaway)} title="Finalizar">
                          <Trophy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(giveaway)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(giveaway)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={!!editingGiveaway || isCreating} onOpenChange={() => { setEditingGiveaway(null); setIsCreating(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGiveaway ? "Editar" : "Crear"} Sorteo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Título *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Sorteo Navidad 2025" />
            </div>
            <div>
              <Label>Premio *</Label>
              <Input value={formData.prize} onChange={(e) => setFormData({ ...formData, prize: e.target.value })} placeholder="Ej: Corte gratis + productos" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del sorteo..." rows={2} />
            </div>
            <div>
              <Label>Requisitos</Label>
              <Textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="Ej: Seguir en Instagram, compartir historia..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha inicio *</Label>
                <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Fecha fin *</Label>
                <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingGiveaway(null); setIsCreating(false); }}>Cancelar</Button>
            <Button onClick={handleSave} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={!!showParticipants} onOpenChange={() => setShowParticipants(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participantes ({participants.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay participantes</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{p.profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{p.profile?.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exclude Users Dialog */}
      <Dialog open={!!showExcludeDialog} onOpenChange={() => setShowExcludeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuarios</DialogTitle>
            <DialogDescription>Selecciona usuarios que no pueden ganar</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {allUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                <Checkbox
                  checked={excludedIds.includes(user.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setExcludedIds([...excludedIds, user.id]);
                    } else {
                      setExcludedIds(excludedIds.filter(id => id !== user.id));
                    }
                  }}
                />
                <Label className="cursor-pointer flex-1">
                  {user.full_name} <span className="text-muted-foreground">@{user.username}</span>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExcludeDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveExclusions} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reselect Winner Dialog */}
      <Dialog open={!!showReselectDialog} onOpenChange={() => setShowReselectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reelegir Ganador</DialogTitle>
            <DialogDescription>
              El ganador actual es: <strong>{showReselectDialog?.winner_name}</strong>
              {showReselectDialog?.winner_username && ` (@${showReselectDialog.winner_username})`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exclude-previous"
                checked={excludePreviousWinner}
                onCheckedChange={(checked) => setExcludePreviousWinner(!!checked)}
              />
              <Label htmlFor="exclude-previous" className="cursor-pointer">
                Excluir al ganador anterior de la nueva selección
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReselectDialog(null)}>Cancelar</Button>
            <Button onClick={handleReselectWinner} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reelegir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
