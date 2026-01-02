import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, User, Phone, Mail, Calendar, Clock, Package, Edit2, Trash2, 
  Gift, Plus, Minus, Ban, ShieldOff, ShieldAlert, Save, X, AlertTriangle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PasswordResetSection } from "@/components/admin/PasswordResetSection";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  contact_method: string;
  contact_value: string;
  created_at: string;
  is_banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  is_restricted?: boolean;
  restriction_ends_at?: string;
  restricted_at?: string;
  temp_password?: string | null;
  temp_password_active?: boolean;
  temp_password_created_at?: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
  created_at: string;
}

interface LoyaltyReward {
  completed_bookings: number;
  free_cuts_available: number;
}

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyaltyReward, setLoyaltyReward] = useState<LoyaltyReward | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit booking dialog
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "" });
  
  // Edit profile dialog
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    username: "",
    contact_method: "phone" as "phone" | "email",
    contact_value: "",
  });
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Restriction dialog
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false);
  const [restrictionHours, setRestrictionHours] = useState("24");
  
  // Ban dialog
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  
  // Restriction countdown
  const [restrictionTimeLeft, setRestrictionTimeLeft] = useState<string>("");

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  // Update restriction countdown
  useEffect(() => {
    if (profile?.is_restricted && profile?.restriction_ends_at) {
      const updateCountdown = () => {
        const endTime = new Date(profile.restriction_ends_at!);
        const now = new Date();
        
        if (now >= endTime) {
          // Restriction has expired, remove it
          handleRemoveRestriction();
          return;
        }
        
        const diff = endTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setRestrictionTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [profile?.is_restricted, profile?.restriction_ends_at]);

  const loadClientData = async () => {
    setLoading(true);

    // Load profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Load bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", id)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });

    if (!bookingsError) {
      setBookings(bookingsData || []);
    }

    // Load loyalty rewards (use maybeSingle to avoid error when no record exists)
    const { data: loyaltyData } = await supabase
      .from("loyalty_rewards")
      .select("completed_bookings, free_cuts_available")
      .eq("user_id", id)
      .maybeSingle();

    setLoyaltyReward(loyaltyData || { completed_bookings: 0, free_cuts_available: 0 });
    setLoading(false);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      date: booking.booking_date,
      time: booking.booking_time,
    });
  };

  const handleSaveBookingEdit = async () => {
    if (!editingBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: editForm.date,
        booking_time: editForm.time,
      })
      .eq("id", editingBooking.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar la reserva", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Reserva actualizada correctamente" });
    setEditingBooking(null);
    loadClientData();
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta reserva?")) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la reserva", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Reserva eliminada correctamente" });
    loadClientData();
  };

  // Profile editing
  const openEditProfile = () => {
    if (!profile) return;
    setProfileForm({
      full_name: profile.full_name,
      username: profile.username,
      contact_method: profile.contact_method as "phone" | "email",
      contact_value: profile.contact_value,
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name,
        username: profileForm.username.toLowerCase().trim(),
        contact_method: profileForm.contact_method,
        contact_value: profileForm.contact_value,
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Perfil actualizado correctamente" });
    setEditingProfile(false);
    loadClientData();
  };

  // Delete client
  const handleDeleteClient = async () => {
    if (!profile) return;
    setDeleting(true);

    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId: profile.id },
      });

      if (error) throw error;

      toast({ title: "Éxito", description: "Cliente eliminado completamente" });
      navigate("/admin");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({ title: "Error", description: "No se pudo eliminar el cliente", variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loyalty management
  const handleAddToCounter = async () => {
    if (!profile) return;

    const currentBookings = loyaltyReward?.completed_bookings || 0;
    const newBookings = currentBookings + 1;
    const shouldAddFreeCut = newBookings % 10 === 0;

    const { error } = await supabase
      .from("loyalty_rewards")
      .upsert({
        user_id: profile.id,
        completed_bookings: newBookings,
        free_cuts_available: shouldAddFreeCut 
          ? (loyaltyReward?.free_cuts_available || 0) + 1 
          : (loyaltyReward?.free_cuts_available || 0),
      }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      return;
    }

    toast({ 
      title: "Éxito", 
      description: shouldAddFreeCut 
        ? "Contador aumentado. ¡Se ha otorgado un corte gratis!" 
        : "Contador aumentado" 
    });
    loadClientData();
  };

  const handleSubtractFromCounter = async () => {
    if (!profile || !loyaltyReward || loyaltyReward.completed_bookings <= 0) return;

    const currentBookings = loyaltyReward.completed_bookings;
    const wasAtMilestone = currentBookings % 10 === 0;

    const { error } = await supabase
      .from("loyalty_rewards")
      .update({
        completed_bookings: currentBookings - 1,
        free_cuts_available: wasAtMilestone && loyaltyReward.free_cuts_available > 0
          ? loyaltyReward.free_cuts_available - 1
          : loyaltyReward.free_cuts_available,
      })
      .eq("user_id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Contador disminuido" });
    loadClientData();
  };

  const handleGrantFreeCut = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("loyalty_rewards")
      .upsert({
        user_id: profile.id,
        completed_bookings: loyaltyReward?.completed_bookings || 0,
        free_cuts_available: 1, // Max 1 at a time (non-cumulative)
      }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error", description: "No se pudo otorgar el corte gratis", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Corte gratis otorgado al cliente" });
    loadClientData();
  };

  const handleRemoveFreeCut = async () => {
    if (!profile || !loyaltyReward || loyaltyReward.free_cuts_available <= 0) return;

    const { error } = await supabase
      .from("loyalty_rewards")
      .update({
        free_cuts_available: 0,
      })
      .eq("user_id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo quitar el corte gratis", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Corte gratis quitado" });
    loadClientData();
  };

  // Restriction management
  const handleRestrict = async () => {
    if (!profile) return;

    const hours = parseInt(restrictionHours);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Error", description: "Introduce un número de horas válido", variant: "destructive" });
      return;
    }

    const restrictionEndsAt = new Date();
    restrictionEndsAt.setHours(restrictionEndsAt.getHours() + hours);

    const { error } = await supabase
      .from("profiles")
      .update({
        is_restricted: true,
        restriction_ends_at: restrictionEndsAt.toISOString(),
        restricted_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo restringir al usuario", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: `Usuario restringido por ${hours} horas` });
    setShowRestrictionDialog(false);
    setRestrictionHours("24");
    loadClientData();
  };

  const handleRemoveRestriction = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_restricted: false,
        restriction_ends_at: null,
        restricted_at: null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo quitar la restricción", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Restricción eliminada" });
    loadClientData();
  };

  // Ban management
  const handleBan = async () => {
    if (!profile) return;

    if (!banReason.trim()) {
      toast({ title: "Error", description: "Debes escribir un motivo para el baneo", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: true,
        ban_reason: banReason.trim(),
        banned_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo banear al usuario", variant: "destructive" });
      return;
    }

    toast({ title: "Usuario baneado", description: "El usuario no podrá iniciar sesión" });
    setShowBanDialog(false);
    setBanReason("");
    loadClientData();
  };

  const handleUnban = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo desbanear al usuario", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: "Usuario desbaneado" });
    loadClientData();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Cliente no encontrado</p>
          <Button onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2" />
            Volver al Panel
          </Button>
        </div>
      </div>
    );
  }

  const progressToFreeCut = loyaltyReward ? loyaltyReward.completed_bookings % 10 : 0;

  return (
    <AdminGuard>
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Volver al Panel
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 text-neon-purple font-aggressive">
            FICHA DE CLIENTE
          </h1>
        </div>

        {/* Status Alerts */}
        {profile.is_banned && (
          <Card className="bg-destructive/20 border-destructive mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-destructive">
                <Ban className="w-5 h-5" />
                <span className="font-bold">USUARIO BANEADO</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Motivo: {profile.ban_reason}
              </p>
              <p className="text-xs text-muted-foreground">
                Baneado el {format(new Date(profile.banned_at!), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </CardContent>
          </Card>
        )}

        {profile.is_restricted && (
          <Card className="bg-yellow-500/20 border-yellow-500 mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-yellow-500">
                <ShieldAlert className="w-5 h-5" />
                <span className="font-bold">USUARIO RESTRINGIDO</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Tiempo restante: <span className="font-mono text-yellow-500">{restrictionTimeLeft}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Client Info */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="text-primary" />
              Información del Cliente
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openEditProfile}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre completo</p>
              <p className="text-lg font-semibold">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre de usuario</p>
              <p className="text-lg font-semibold">@{profile.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacto</p>
              <div className="flex items-center gap-2">
                {profile.contact_method === "email" ? (
                  <Mail className="w-4 h-4 text-neon-cyan" />
                ) : (
                  <Phone className="w-4 h-4 text-neon-cyan" />
                )}
                <p className="text-lg font-semibold">{profile.contact_value}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente desde</p>
              <p className="text-lg font-semibold">
                {format(new Date(profile.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program Management */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Gift className="text-neon-cyan" />
              Programa de Fidelización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progreso hacia corte gratis</span>
                  <span className="text-sm font-semibold">{progressToFreeCut}/10</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-neon-cyan transition-all duration-300"
                    style={{ width: `${(progressToFreeCut / 10) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total de reservas válidas: {loyaltyReward?.completed_bookings || 0}
                </p>
              </div>

              {/* Free cuts available */}
              {loyaltyReward && loyaltyReward.free_cuts_available > 0 && (
                <div className="p-4 bg-neon-cyan/20 rounded-lg border border-neon-cyan">
                  <p className="font-bold text-neon-cyan">
                    🎉 ¡Tiene {loyaltyReward.free_cuts_available} corte(s) gratis disponible(s)!
                  </p>
                </div>
              )}

              {/* Admin Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleAddToCounter}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  +1 al contador
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSubtractFromCounter}
                  disabled={!loyaltyReward || loyaltyReward.completed_bookings <= 0}
                  className="flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  -1 al contador
                </Button>
                <Button 
                  variant="neon" 
                  onClick={handleGrantFreeCut}
                  className="flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Otorgar corte
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveFreeCut}
                  disabled={!loyaltyReward || loyaltyReward.free_cuts_available <= 0}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Quitar corte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset Section */}
        <PasswordResetSection profile={profile} onUpdate={loadClientData} />

        {/* Admin Actions */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldAlert className="text-yellow-500" />
              Acciones de Administración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Restriction */}
              {profile.is_restricted ? (
                <Button 
                  variant="outline" 
                  onClick={handleRemoveRestriction}
                  className="flex items-center gap-2 border-green-500 text-green-500 hover:bg-green-500/20"
                >
                  <ShieldOff className="w-4 h-4" />
                  Quitar restricción
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowRestrictionDialog(true)}
                  className="flex items-center gap-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Restringir temporalmente
                </Button>
              )}

              {/* Ban */}
              {profile.is_banned ? (
                <Button 
                  variant="outline" 
                  onClick={handleUnban}
                  className="flex items-center gap-2 border-green-500 text-green-500 hover:bg-green-500/20"
                >
                  <ShieldOff className="w-4 h-4" />
                  Quitar baneo
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowBanDialog(true)}
                  className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/20"
                >
                  <Ban className="w-4 h-4" />
                  Banear usuario
                </Button>
              )}

              {/* Delete */}
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 sm:col-span-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar cliente permanentemente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="text-neon-cyan" />
              Historial de Reservas
            </CardTitle>
            <CardDescription>
              Total de reservas: {bookings.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Este cliente aún no tiene reservas
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {format(new Date(booking.booking_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neon-cyan" />
                          <span>{booking.booking_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-secondary mt-1" />
                          <div className="flex flex-col">
                            {Array.isArray(booking.services) && booking.services.length > 0 ? (
                              booking.services.map((service: string, idx: number) => (
                                <span key={idx} className="text-sm text-muted-foreground">
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin servicios</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {booking.total_price}€
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditBooking(booking)}
                            title="Editar reserva"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteBooking(booking.id)}
                            title="Eliminar reserva"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Booking Dialog */}
        <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
              <DialogDescription>
                Modifica la fecha y hora de la reserva
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBooking(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBookingEdit}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Modifica la información del cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
                />
              </div>
              <div>
                <Label>Método de contacto</Label>
                <RadioGroup 
                  value={profileForm.contact_method} 
                  onValueChange={(v) => setProfileForm({ ...profileForm, contact_method: v as "phone" | "email" })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone">Teléfono</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email">Email</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="contact_value">
                  {profileForm.contact_method === "phone" ? "Teléfono" : "Email"}
                </Label>
                <Input
                  id="contact_value"
                  type={profileForm.contact_method === "email" ? "email" : "tel"}
                  value={profileForm.contact_value}
                  onChange={(e) => setProfileForm({ ...profileForm, contact_value: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProfile(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restriction Dialog */}
        <Dialog open={showRestrictionDialog} onOpenChange={setShowRestrictionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                Restringir Usuario
              </DialogTitle>
              <DialogDescription>
                El usuario no podrá hacer reservas durante el tiempo especificado
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="hours">Duración de la restricción (horas)</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                value={restrictionHours}
                onChange={(e) => setRestrictionHours(e.target.value)}
                placeholder="24"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestrictionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRestrict} className="bg-yellow-500 hover:bg-yellow-600">
                Restringir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ban Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" />
                Banear Usuario
              </DialogTitle>
              <DialogDescription>
                El usuario no podrá iniciar sesión y verá este mensaje
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Motivo del baneo (se mostrará al usuario)</Label>
              <Textarea
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Escribe el motivo del baneo..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleBan}>
                Banear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="¿Eliminar cliente permanentemente?"
          description="Esta acción no se puede deshacer. Se eliminarán todos los datos del cliente incluyendo su perfil, reservas, valoraciones, datos de fidelización y cuenta de autenticación."
          confirmText={deleting ? "Eliminando..." : "Eliminar permanentemente"}
          cancelText="Cancelar"
          onConfirm={handleDeleteClient}
          variant="destructive"
        />
      </div>
    </div>
    </AdminGuard>
  );
};

export default ClientProfile;