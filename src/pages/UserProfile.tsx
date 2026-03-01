import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuthEnabled } from "@/hooks/useGoogleAuthEnabled";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Calendar, Star, Gift, X, RotateCcw, Link2, Check, ChevronRight, Clock, Package, Camera, Lock, User, Shield, Edit2, AtSign } from "lucide-react";
import { RatingDialog } from "@/components/RatingDialog";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { Separator } from "@/components/ui/separator";
import { UserAchievements } from "@/components/UserAchievements";
import { NotificationPreferences } from "@/components/pwa/NotificationPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
  created_at: string;
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  rating?: {
    id: string;
    rating: number;
    comment: string | null;
  };
}

interface LoyaltyReward {
  completed_bookings: number;
  free_cuts_available: number;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    signOut,
    refreshProfile,
    checkAccountStatus
  } = useAuth();
  const { isGoogleAuthEnabled } = useGoogleAuthEnabled();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyaltyReward, setLoyaltyReward] = useState<LoyaltyReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null);
  const [cancelMode, setCancelMode] = useState<"cancel" | "reschedule">("cancel");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);
  const isMobile = useIsMobile();

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Username change
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check account status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      const status = await checkAccountStatus();
      if (status.isBanned) {
        toast({
          title: "Cuenta suspendida",
          description: status.banReason,
          variant: "destructive",
        });
        await signOut();
        navigate("/auth");
      }
    };
    checkStatus();
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile) {
      setFullName(profile.full_name);
      setContactMethod(profile.contact_method);
      setContactValue(profile.contact_value);
    }
    fetchBookings();
    fetchLoyaltyReward();
    checkGoogleConnection();
    loadAvatar();
  }, [user, profile, navigate]);

  const loadAvatar = async () => {
    if (!user) return;
    // Check profile for avatar_url
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no puede superar 2MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const url = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast({ title: "Foto actualizada" });
  };

  const checkGoogleConnection = async () => {
    if (!user) return;
    const { data } = await supabase.auth.getUserIdentities();
    const hasGoogle = data?.identities?.some(identity => identity.provider === 'google');
    setGoogleConnected(!!hasGoogle);
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/user` },
      });
      if (error) {
        toast({ title: "Error", description: "No se pudo conectar con Google", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Error al conectar con Google", variant: "destructive" });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const fetchLoyaltyReward = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("loyalty_rewards").select("completed_bookings, free_cuts_available").eq("user_id", user.id).single();
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching loyalty reward:", error);
    } else {
      setLoyaltyReward(data || { completed_bookings: 0, free_cuts_available: 0 });
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    const { data: bookingsData, error: bookingsError } = await supabase.from("bookings").select("*").eq("user_id", user.id).order("booking_date", { ascending: false });
    if (bookingsError) {
      toast({ title: "Error", description: "No se pudieron cargar las reservas", variant: "destructive" });
      setLoading(false);
      return;
    }

    const bookingIds = (bookingsData || []).map(b => b.id);
    const { data: ratingsData } = await supabase.from("ratings").select("*").in("booking_id", bookingIds);
    const ratingsMap = new Map(ratingsData?.map(r => [r.booking_id, r]) || []);
    const bookingsWithRatings = (bookingsData || []).map(booking => ({
      ...booking,
      rating: ratingsMap.get(booking.id)
    }));
    setBookings(bookingsWithRatings);
    setLoading(false);
  };

  const handleRateBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmitted = () => { fetchBookings(); };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!fullName.trim() || !contactValue.trim()) {
      toast({ title: "Error", description: "Por favor completa todos los campos", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      contact_method: contactMethod,
      contact_value: contactValue
    }).eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Perfil actualizado correctamente" });
      setEditing(false);
      await refreshProfile();
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setChangingPassword(true);

    // Verify current password by re-signing in
    if (!user?.email) {
      toast({ title: "Error", description: "No se pudo verificar la identidad", variant: "destructive" });
      setChangingPassword(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      toast({ title: "Error", description: "La contraseña actual es incorrecta", variant: "destructive" });
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Error", description: "No se pudo cambiar la contraseña", variant: "destructive" });
    } else {
      toast({ title: "Contraseña cambiada", description: "Tu contraseña se ha actualizado correctamente" });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .neq("id", user?.id || "")
      .limit(1);

    setUsernameAvailable(!data || data.length === 0);
    setCheckingUsername(false);
  };

  const handleChangeUsername = async () => {
    if (!user || !newUsername.trim()) return;
    const cleanUsername = newUsername.toLowerCase().trim();

    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      toast({ title: "Error", description: "Solo letras minúsculas, números, _ y .", variant: "destructive" });
      return;
    }
    if (cleanUsername.length < 3) {
      toast({ title: "Error", description: "Mínimo 3 caracteres", variant: "destructive" });
      return;
    }

    setSavingUsername(true);
    const { error } = await supabase.from("profiles").update({ username: cleanUsername }).eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo cambiar el nombre de usuario", variant: "destructive" });
    } else {
      toast({ title: "Username actualizado" });
      setShowUsernameDialog(false);
      await refreshProfile();
    }
    setSavingUsername(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isPastBooking = (bookingDate: string, bookingTime: string) => {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    return bookingDateTime < new Date();
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Cargando...</p>
    </div>;
  }

  const currentBookings = bookings.filter(b => !isPastBooking(b.booking_date, b.booking_time) && !b.is_cancelled);
  const cancelledBookings = bookings.filter(b => b.is_cancelled);
  const pastBookings = bookings.filter(b => isPastBooking(b.booking_date, b.booking_time) && !b.is_cancelled);

  const initials = (profile?.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-6 pt-safe max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Mi Perfil</h1>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-destructive">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 h-20" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col items-center -mt-12">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-card">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-neon-purple/20 text-neon-purple">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <h2 className="text-xl font-bold mt-3">{profile?.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5"
          onClick={() => setEditing(true)}
        >
          <Edit2 className="h-4 w-4" />
          <span className="text-xs">Editar perfil</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5"
          onClick={() => { setNewUsername(profile?.username || ""); setShowUsernameDialog(true); }}
        >
          <AtSign className="h-4 w-4" />
          <span className="text-xs">Cambiar usuario</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5"
          onClick={() => setShowPasswordDialog(true)}
        >
          <Lock className="h-4 w-4" />
          <span className="text-xs">Cambiar contraseña</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5"
          onClick={() => navigate("/loyalty")}
        >
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-xs">Fidelización</span>
        </Button>
      </div>

      {/* Profile Info */}
      {editing ? (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Editar Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactMethod">Método de Contacto</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email" disabled>Email</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contactValue">{contactMethod === "email" ? "Email" : "Teléfono"}</Label>
              <Input id="contactValue" value={contactValue} onChange={e => setContactValue(e.target.value)} type={contactMethod === "email" ? "email" : "tel"} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile} className="flex-1">Guardar</Button>
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium text-sm">{profile?.full_name}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Usuario</p>
                <p className="font-medium text-sm">@{profile?.username}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{profile?.contact_method === "email" ? "Email" : "Teléfono"}</p>
                <p className="font-medium text-sm">{profile?.contact_value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Conexiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-medium text-sm">Google</span>
            </div>
            {googleConnected ? (
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-4 w-4" />
                <span className="text-xs">Conectado</span>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnectGoogle} disabled={connectingGoogle || !isGoogleAuthEnabled}>
                {connectingGoogle ? "..." : !isGoogleAuthEnabled ? "No disponible" : "Conectar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <div className="mb-6">
        <NotificationPreferences />
      </div>

      {/* Achievements */}
      <div className="mb-6">
        {user && <UserAchievements userId={user.id} />}
      </div>

      {/* Bookings Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Historial de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Bookings */}
            {currentBookings.length > 0 && <div>
              <h3 className="text-sm font-semibold mb-3">Próximas Reservas</h3>
              <div className="space-y-2">
                {currentBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border border-border rounded-lg p-3 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedBookingDetail(booking)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {new Date(booking.booking_date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {booking.booking_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-sm">{booking.total_price}€</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Past Bookings */}
            {pastBookings.length > 0 && <div>
              <h3 className="text-sm font-semibold mb-3">Reservas Pasadas</h3>
              <div className="space-y-2">
                {pastBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border border-border rounded-lg p-3 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedBookingDetail(booking)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {new Date(booking.booking_date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {booking.booking_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.rating ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                          <span>{booking.rating.rating}/5</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); handleRateBooking(booking.id); }}>
                          Valorar
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {bookings.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No tienes reservas aún</p>}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Dialogs */}
    {selectedBookingId && user && <RatingDialog bookingId={selectedBookingId} userId={user.id} open={ratingDialogOpen} onOpenChange={setRatingDialogOpen} onRatingSubmitted={handleRatingSubmitted} />}
    
    {cancelDialogBooking && (
      <CancelBookingDialog
        open={!!cancelDialogBooking}
        onOpenChange={(open) => !open && setCancelDialogBooking(null)}
        booking={cancelDialogBooking}
        onSuccess={fetchBookings}
        mode={cancelMode}
      />
    )}

    {/* Booking Detail Modal */}
    <Dialog open={!!selectedBookingDetail} onOpenChange={(open) => !open && setSelectedBookingDetail(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Detalle de Reserva</DialogTitle>
        </DialogHeader>
        {selectedBookingDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">
                {new Date(selectedBookingDetail.booking_date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{selectedBookingDetail.booking_time.slice(0, 5)}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Servicios
              </p>
              <div className="space-y-1">
                {Array.isArray(selectedBookingDetail.services) && selectedBookingDetail.services.map((s: string, i: number) => (
                  <p key={i} className="text-sm">{s}</p>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{selectedBookingDetail.total_price}€</span>
            </div>
            {selectedBookingDetail.rating && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-medium">{selectedBookingDetail.rating.rating}/5</span>
                {selectedBookingDetail.rating.comment && (
                  <span className="text-sm text-muted-foreground ml-2">"{selectedBookingDetail.rating.comment}"</span>
                )}
              </div>
            )}
            {!isPastBooking(selectedBookingDetail.booking_date, selectedBookingDetail.booking_time) && !selectedBookingDetail.is_cancelled && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setCancelDialogBooking(selectedBookingDetail); setCancelMode("reschedule"); setSelectedBookingDetail(null); }}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reubicar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => { setCancelDialogBooking(selectedBookingDetail); setCancelMode("cancel"); setSelectedBookingDetail(null); }}>
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
              </div>
            )}
            {isPastBooking(selectedBookingDetail.booking_date, selectedBookingDetail.booking_time) && !selectedBookingDetail.rating && !selectedBookingDetail.is_cancelled && (
              <Button variant="outline" className="w-full" onClick={() => { handleRateBooking(selectedBookingDetail.id); setSelectedBookingDetail(null); }}>
                <Star className="h-4 w-4 mr-2" /> Valorar esta visita
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Password Dialog */}
    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Contraseña actual</Label>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirmar nueva contraseña</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancelar</Button>
          <Button onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? "Cambiando..." : "Cambiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Username Dialog */}
    <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar nombre de usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nuevo username</Label>
            <Input
              value={newUsername}
              onChange={e => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                setNewUsername(val);
                setUsernameAvailable(null);
              }}
              onBlur={() => checkUsernameAvailability(newUsername)}
              placeholder="nuevo_username"
            />
            {checkingUsername && <p className="text-xs text-muted-foreground mt-1">Verificando...</p>}
            {usernameAvailable === true && <p className="text-xs text-green-500 mt-1">✓ Disponible</p>}
            {usernameAvailable === false && <p className="text-xs text-destructive mt-1">✗ No disponible</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUsernameDialog(false)}>Cancelar</Button>
          <Button onClick={handleChangeUsername} disabled={savingUsername || usernameAvailable === false}>
            {savingUsername ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}