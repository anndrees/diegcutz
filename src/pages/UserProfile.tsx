import { useState, useEffect } from "react";
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
import { ArrowLeft, LogOut, Calendar, Star, Gift, X, RotateCcw, Link2, Check, ChevronRight, Clock, Package } from "lucide-react";
import { RatingDialog } from "@/components/RatingDialog";
import { Progress } from "@/components/ui/progress";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { Separator } from "@/components/ui/separator";
import { UserAchievements } from "@/components/UserAchievements";
import { NotificationPreferences } from "@/components/pwa/NotificationPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  }, [user, profile, navigate]);

  const checkGoogleConnection = async () => {
    if (!user) return;
    
    // Check if user has Google identity linked
    const { data } = await supabase.auth.getUserIdentities();
    const hasGoogle = data?.identities?.some(identity => identity.provider === 'google');
    setGoogleConnected(!!hasGoogle);
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/user`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo conectar con Google",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al conectar con Google",
        variant: "destructive",
      });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const fetchLoyaltyReward = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("loyalty_rewards").select("completed_bookings, free_cuts_available").eq("user_id", user.id).single();
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching loyalty reward:", error);
    } else {
      setLoyaltyReward(data || {
        completed_bookings: 0,
        free_cuts_available: 0
      });
    }
  };
  const fetchBookings = async () => {
    if (!user) return;
    const {
      data: bookingsData,
      error: bookingsError
    } = await supabase.from("bookings").select("*").eq("user_id", user.id).order("booking_date", {
      ascending: false
    });
    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Load ratings for each booking
    const bookingIds = (bookingsData || []).map(b => b.id);
    const {
      data: ratingsData
    } = await supabase.from("ratings").select("*").in("booking_id", bookingIds);
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
  const handleRatingSubmitted = () => {
    fetchBookings();
  };
  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!fullName.trim() || !contactValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    const {
      error
    } = await supabase.from("profiles").update({
      full_name: fullName,
      contact_method: contactMethod,
      contact_value: contactValue
    }).eq("id", user.id);
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente"
      });
      setEditing(false);
      await refreshProfile();
    }
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
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-safe">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button variant="destructive" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? <>
                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="contactMethod">Método de Contacto</Label>
                    <Select value={contactMethod} onValueChange={setContactMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email" disabled>Email</SelectItem>
                        <SelectItem value="phone">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contactValue">
                      {contactMethod === "email" ? "Email" : "Teléfono"}
                    </Label>
                    <Input id="contactValue" value={contactValue} onChange={e => setContactValue(e.target.value)} type={contactMethod === "email" ? "email" : "tel"} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile}>Guardar</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </> : <>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">@{profile?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {profile?.contact_method === "email" ? "Email" : "Teléfono"}
                    </p>
                    <p className="font-medium">{profile?.contact_value}</p>
                  </div>
                  <Button onClick={() => setEditing(true)} variant="outline">
                    Editar Perfil
                  </Button>
                </>}

              <Separator className="my-6" />

              {/* Connections Section */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Conexiones
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="font-medium">Google</span>
                    </div>
                    {googleConnected ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Conectado</span>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleConnectGoogle}
                        disabled={connectingGoogle || !isGoogleAuthEnabled}
                        title={!isGoogleAuthEnabled ? "La vinculación con Google está temporalmente deshabilitada" : undefined}
                      >
                        {connectingGoogle ? "Conectando..." : !isGoogleAuthEnabled ? "No disponible" : "Conectar"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <NotificationPreferences />

          {/* Loyalty Rewards Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="text-primary" />
                Programa de Fidelización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Progreso hacia tu próximo corte gratis</p>
                  <p className="text-sm font-bold text-primary">
                    {loyaltyReward ? loyaltyReward.completed_bookings % 10 : 0}/10
                  </p>
                </div>
                <Progress value={loyaltyReward ? loyaltyReward.completed_bookings % 10 / 10 * 100 : 0} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  * Solo cuentan reservas de 5€ o más
                </p>
              </div>
              
              {loyaltyReward && loyaltyReward.free_cuts_available > 0 && <div className="p-4 bg-neon-cyan/10 border-2 border-neon-cyan rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="text-neon-cyan" />
                    <p className="font-bold text-neon-cyan">
                      ¡Tienes {loyaltyReward.free_cuts_available} corte{loyaltyReward.free_cuts_available > 1 ? 's' : ''} gratis disponible{loyaltyReward.free_cuts_available > 1 ? 's' : ''}!
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Incluye: DEGRADADO + VACIAR/TEXTURIZADO
                  </p>
                  <Button onClick={() => navigate("/booking?free_cut=true")} className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-background font-bold">
                    <Gift className="mr-2 h-4 w-4" />
                    ¡Reclamar Corte Gratis!
                  </Button>
                </div>}
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Total de reservas válidas:</strong> {loyaltyReward?.completed_bookings || 0}</p>
                <p className="mt-1">Cada 10 reservas, ¡te regalamos un corte!</p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card - Full width */}
          <div className="md:col-span-2">
            {user && <UserAchievements userId={user.id} />}
          </div>
        </div>

        {/* Bookings Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-primary" />
                Historial de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Bookings */}
                {currentBookings.length > 0 && <div>
                    <h3 className="text-lg font-semibold mb-4">Próximas Reservas</h3>
                    {isMobile ? (
                      <div className="space-y-3">
                        {currentBookings.map(booking => (
                          <div
                            key={booking.id}
                            className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors cursor-pointer"
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
                              <span className="font-bold text-primary">{booking.total_price}€</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Servicios</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBookings.map(booking => <TableRow key={booking.id}>
                              <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                              <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                              <TableCell>
                                {Array.isArray(booking.services) && booking.services.map((s, i) => <div key={i}>{s}</div>)}
                              </TableCell>
                              <TableCell className="text-right font-bold">{booking.total_price}€</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setCancelDialogBooking(booking); setCancelMode("reschedule"); }}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Reubicar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => { setCancelDialogBooking(booking); setCancelMode("cancel"); }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                              </TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table>
                    )}
                  </div>}

                {/* Past Bookings */}
                {pastBookings.length > 0 && <div>
                    <h3 className="text-lg font-semibold mb-4">Reservas Pasadas</h3>
                    {isMobile ? (
                      <div className="space-y-3">
                        {pastBookings.map(booking => (
                          <div
                            key={booking.id}
                            className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors cursor-pointer"
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
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Servicios</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Valoración</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pastBookings.map(booking => <TableRow key={booking.id}>
                              <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                              <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                              <TableCell>
                                {Array.isArray(booking.services) && booking.services.map((s, i) => <div key={i}>{s}</div>)}
                              </TableCell>
                              <TableCell className="text-right font-bold">{booking.total_price}€</TableCell>
                              <TableCell className="text-right">
                                {booking.rating ? <div className="flex items-center justify-end gap-1">
                                    <Star className="w-4 h-4 fill-primary text-primary" />
                                    <span>{booking.rating.rating}/5</span>
                                  </div> : <Button variant="outline" size="sm" onClick={() => handleRateBooking(booking.id)}>
                                    Valorar
                                  </Button>}
                              </TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table>
                    )}
                  </div>}

                {bookings.length === 0 && <p className="text-center text-muted-foreground py-8">No tienes reservas aún</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Mobile Booking Detail Modal */}
      <Dialog open={!!selectedBookingDetail} onOpenChange={(open) => !open && setSelectedBookingDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
          </DialogHeader>
          {selectedBookingDetail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold">
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
              {/* Actions for current bookings */}
              {!isPastBooking(selectedBookingDetail.booking_date, selectedBookingDetail.booking_time) && !selectedBookingDetail.is_cancelled && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setCancelDialogBooking(selectedBookingDetail); setCancelMode("reschedule"); setSelectedBookingDetail(null); }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reubicar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setCancelDialogBooking(selectedBookingDetail); setCancelMode("cancel"); setSelectedBookingDetail(null); }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
              {/* Rate button for past unrated bookings */}
              {isPastBooking(selectedBookingDetail.booking_date, selectedBookingDetail.booking_time) && !selectedBookingDetail.rating && !selectedBookingDetail.is_cancelled && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { handleRateBooking(selectedBookingDetail.id); setSelectedBookingDetail(null); }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Valorar esta visita
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>;
}