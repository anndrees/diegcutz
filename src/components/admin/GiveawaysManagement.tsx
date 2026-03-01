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
import { Edit2, Trash2, Plus, Trophy, Users, Ban, Shuffle, RotateCcw, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WinnerAnimation } from "./WinnerAnimation";
import { sendGiveawayWinnerNotification, sendNewGiveawayNotification } from "@/lib/pushNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

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
  instagram_url: string | null;
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
  const isMobile = useIsMobile();
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
  
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{ name: string; username: string; giveawayTitle: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    prize: "",
    instagram_url: "",
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
      instagram_url: "",
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
      instagram_url: giveaway.instagram_url || "",
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
      instagram_url: formData.instagram_url || null,
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
      const { data: newGiveaway, error } = await supabase.from("giveaways").insert(payload).select().single();

      if (error) {
        toast({ title: "Error", description: "No se pudo crear el sorteo", variant: "destructive" });
        return;
      }

      await supabase.from("admin_action_logs").insert({
        action_type: "CREATE_GIVEAWAY",
        description: `Creó el sorteo "${formData.title}"`,
      });

      if (newGiveaway) {
        sendNewGiveawayNotification(newGiveaway.title, newGiveaway.prize, newGiveaway.end_date);
      }

      toast({ title: "Sorteo creado", description: "El sorteo se creó correctamente y se notificó a todos los usuarios" });
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

    sendGiveawayWinnerNotification(winner.user_id, giveaway.title, giveaway.prize);

    setSelectedWinner({
      name: winnerProfile?.full_name || "Usuario",
      username: winnerProfile?.username || "usuario",
      giveawayTitle: giveaway.title,
    });
    setShowWinnerAnimation(true);

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

  const GiveawayCard = ({ giveaway }: { giveaway: Giveaway }) => {
    const [expanded, setExpanded] = useState(false);
    const status = getStatus(giveaway);

    return (
      <div
        className="border border-border rounded-xl p-4 transition-all hover:border-primary/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold truncate">{giveaway.title}</p>
              <Badge variant={status.variant} className="shrink-0 text-[10px]">{status.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">🎁 {giveaway.prize}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {format(new Date(giveaway.start_date), "d MMM", { locale: es })} → {format(new Date(giveaway.end_date), "d MMM", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {giveaway.winner_id && <Trophy className="h-4 w-4 text-yellow-500" />}
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3" onClick={(e) => e.stopPropagation()}>
            {giveaway.winner_id && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <Link to={`/admin/client/${giveaway.winner_id}`} className="text-neon-cyan hover:underline text-sm font-medium">
                  {giveaway.winner_name} (@{giveaway.winner_username})
                </Link>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => loadParticipants(giveaway.id)}>
                <Users className="h-3 w-3 mr-1" /> Participantes
              </Button>
              <Button size="sm" variant="outline" onClick={() => loadAllUsers(giveaway)}>
                <Ban className="h-3 w-3 mr-1" /> Excluir
              </Button>
              {!giveaway.winner_id && (
                <Button size="sm" variant="outline" className="text-neon-cyan border-neon-cyan/30" onClick={() => handleSelectWinner(giveaway)}>
                  <Shuffle className="h-3 w-3 mr-1" /> Sortear
                </Button>
              )}
              {giveaway.winner_id && (
                <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/30" onClick={() => setShowReselectDialog(giveaway)}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reelegir
                </Button>
              )}
              {!giveaway.is_finished && !giveaway.winner_id && (
                <Button size="sm" variant="outline" onClick={() => handleFinish(giveaway)}>
                  <Trophy className="h-3 w-3 mr-1" /> Finalizar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => handleEdit(giveaway)}>
                <Edit2 className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleDelete(giveaway)}>
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
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
        ) : isMobile ? (
          <div className="space-y-3">
            {giveaways.map((giveaway) => (
              <GiveawayCard key={giveaway.id} giveaway={giveaway} />
            ))}
          </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="Requisitos para participar..." rows={2} />
            </div>
            <div>
              <Label>URL de Instagram</Label>
              <Input value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
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
            <DialogTitle>Participantes del sorteo</DialogTitle>
            <DialogDescription>
              {participants.length} participante{participants.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay participantes</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <span className="font-medium">{p.profile?.full_name || "Desconocido"}</span>
                    <span className="text-muted-foreground text-sm">@{p.profile?.username || "?"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exclude Dialog */}
      <Dialog open={!!showExcludeDialog} onOpenChange={() => setShowExcludeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuarios del sorteo</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2">
                <Checkbox
                  checked={excludedIds.includes(u.id)}
                  onCheckedChange={(checked) => {
                    setExcludedIds(checked
                      ? [...excludedIds, u.id]
                      : excludedIds.filter(id => id !== u.id)
                    );
                  }}
                />
                <span>{u.full_name} (@{u.username})</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExcludeDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveExclusions} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reselect Dialog */}
      <Dialog open={!!showReselectDialog} onOpenChange={() => setShowReselectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reelegir ganador</DialogTitle>
            <DialogDescription>
              ¿Deseas excluir al ganador anterior ({showReselectDialog?.winner_name}) de la nueva selección?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={excludePreviousWinner}
                onCheckedChange={(v) => setExcludePreviousWinner(!!v)}
              />
              <Label>Excluir al ganador anterior</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReselectDialog(null)}>Cancelar</Button>
            <Button onClick={handleReselectWinner} variant="neon">Sortear nuevo ganador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Winner Animation */}
      {selectedWinner && (
        <WinnerAnimation
          open={showWinnerAnimation}
          winnerName={selectedWinner.name}
          winnerUsername={selectedWinner.username}
          giveawayTitle={selectedWinner.giveawayTitle}
          onClose={() => setShowWinnerAnimation(false)}
        />
      )}
    </Card>
  );
};