import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Search, Smartphone, ArrowUpDown, ChevronRight, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

type Client = {
  id: string; full_name: string; username: string; contact_method: string;
  contact_value: string; created_at: string; pwa_installed_at: string | null;
};
type LoyaltyMap = Record<string, number>;
type MembershipInfo = { membership_id: string; plan_name: string; plan_emoji: string; sort_order: number };
type MembershipMap = Record<string, MembershipInfo>;
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "points_desc" | "points_asc";

// Tier colors by sort_order
const TIER_COLORS: Record<number, { border: string; bg: string; text: string }> = {
  0: { border: "border-orange-400/50", bg: "bg-orange-400/5", text: "text-orange-400" },     // Basic
  1: { border: "border-emerald-400/50", bg: "bg-emerald-400/5", text: "text-emerald-400" },   // Fresh Look
  2: { border: "border-[#D4AF37]/50", bg: "bg-[#D4AF37]/5", text: "text-[#D4AF37]" },       // Premium
  3: { border: "border-neon-purple/50", bg: "bg-neon-purple/5", text: "text-neon-purple" },   // VIP
};

const getTierStyle = (sortOrder: number) => TIER_COLORS[sortOrder] || TIER_COLORS[0];

export const ClientsManagement = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [clients, setClients] = useState<Client[]>([]);
  const [loyaltyMap, setLoyaltyMap] = useState<LoyaltyMap>({});
  const [membershipMap, setMembershipMap] = useState<MembershipMap>({});
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [formData, setFormData] = useState({ full_name: "", username: "", contact_value: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    const [profilesRes, loyaltyRes, membershipsRes, userMembershipsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("loyalty_rewards").select("user_id, completed_bookings"),
      supabase.from("memberships").select("id, name, emoji, sort_order"),
      supabase.from("user_memberships").select("user_id, membership_id").eq("status", "active"),
    ]);
    setLoading(false);
    if (profilesRes.error) { toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" }); return; }
    setClients(profilesRes.data || []);

    const lMap: LoyaltyMap = {};
    (loyaltyRes.data || []).forEach(lr => { lMap[lr.user_id] = lr.completed_bookings; });
    setLoyaltyMap(lMap);

    const mMap = new Map((membershipsRes.data || []).map((m: any) => [m.id, m]));
    const umMap: MembershipMap = {};
    (userMembershipsRes.data || []).forEach((um: any) => {
      const m = mMap.get(um.membership_id);
      if (m) umMap[um.user_id] = { membership_id: um.membership_id, plan_name: m.name, plan_emoji: m.emoji, sort_order: m.sort_order };
    });
    setMembershipMap(umMap);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ full_name: client.full_name, username: client.username, contact_value: client.contact_value });
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.username || !formData.contact_value) { toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" }); return; }
    if (!editingClient) return;
    const { error } = await supabase.from("profiles").update(formData).eq("id", editingClient.id);
    if (error) { toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }); return; }
    toast({ title: "Cliente actualizado" }); setEditingClient(null); loadClients();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.client) return;
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId: deleteDialog.client.id } });
      if (error || data?.error) { toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" }); return; }
      toast({ title: "Cliente eliminado" }); loadClients();
    } catch { toast({ title: "Error", description: "Error inesperado", variant: "destructive" }); }
    finally { setDeleteDialog({ open: false, client: null }); }
  };

  const getPoints = (clientId: string) => loyaltyMap[clientId] || 0;
  const getMembership = (clientId: string) => membershipMap[clientId] || null;

  const filteredAndSortedClients = clients
    .filter(client =>
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_value.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc": return a.full_name.localeCompare(b.full_name);
        case "name_desc": return b.full_name.localeCompare(a.full_name);
        case "points_desc": return getPoints(b.id) - getPoints(a.id);
        case "points_asc": return getPoints(a.id) - getPoints(b.id);
        default: return 0;
      }
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <CardTitle>Gestión de Clientes ({clients.length})</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]"><ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                <SelectItem value="points_desc">Más puntos</SelectItem>
                <SelectItem value="points_asc">Menos puntos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : filteredAndSortedClients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}</p>
        ) : isMobile ? (
          <div className="space-y-2">
            {filteredAndSortedClients.map((client) => {
              const mem = getMembership(client.id);
              const tierStyle = mem ? getTierStyle(mem.sort_order) : null;
              return (
                <Link key={client.id} to={`/admin/client/${client.id}`} className="block">
                  <div className={`border rounded-xl p-3 hover:border-primary/30 transition-all flex items-center gap-3 ${tierStyle ? `${tierStyle.border} ${tierStyle.bg}` : "border-border"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tierStyle ? tierStyle.bg : "bg-primary/10"}`}>
                      {mem ? (
                        <Crown className={`h-5 w-5 ${tierStyle?.text || "text-primary"}`} />
                      ) : (
                        <span className="text-sm font-bold text-primary">{client.full_name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold truncate">{client.full_name}</p>
                        {client.pwa_installed_at && <Smartphone className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{client.username} · {getPoints(client.id)} pts
                        {mem && <span className={`ml-1 ${tierStyle?.text}`}> · {mem.plan_emoji} {mem.plan_name}</span>}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClients.map((client) => {
                  const mem = getMembership(client.id);
                  const tierStyle = mem ? getTierStyle(mem.sort_order) : null;
                  return (
                    <TableRow key={client.id} className={tierStyle ? tierStyle.bg : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {mem && <Crown className={`h-4 w-4 ${tierStyle?.text}`} />}
                          {client.full_name}
                          <span className="text-xs text-muted-foreground">({getPoints(client.id)})</span>
                          {client.pwa_installed_at && (
                            <TooltipProvider><Tooltip><TooltipTrigger><Smartphone className="h-3.5 w-3.5 text-primary" /></TooltipTrigger><TooltipContent><p>PWA instalada</p></TooltipContent></Tooltip></TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/client/${client.id}`} className="text-primary hover:text-primary/80 underline underline-offset-4">{client.username}</Link>
                      </TableCell>
                      <TableCell>
                        {mem ? (
                          <span className={`text-xs font-semibold ${tierStyle?.text}`}>{mem.plan_emoji} {mem.plan_name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{client.contact_value}</TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, client })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle><DialogDescription>Modifica los datos del cliente</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="full_name">Nombre Completo</Label><Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} /></div>
            <div><Label htmlFor="username">Usuario</Label><Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
            <div><Label htmlFor="contact_value">Contacto</Label><Input id="contact_value" value={formData.contact_value} onChange={(e) => setFormData({ ...formData, contact_value: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
            <Button onClick={handleSave} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, client: deleteDialog.client })}
        title="Eliminar cliente" description={`¿Eliminar a ${deleteDialog.client?.full_name}? Se borrará COMPLETAMENTE.`}
        confirmText="Eliminar" cancelText="Cancelar" variant="destructive" onConfirm={handleDeleteConfirm} />
    </Card>
  );
};
