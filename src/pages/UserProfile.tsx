import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Calendar, Star, Gift } from "lucide-react";
import { RatingDialog } from "@/components/RatingDialog";
import { Progress } from "@/components/ui/progress";
interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
  created_at: string;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyaltyReward, setLoyaltyReward] = useState<LoyaltyReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

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
  }, [user, profile, navigate]);
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
  const currentBookings = bookings.filter(b => !isPastBooking(b.booking_date, b.booking_time));
  const pastBookings = bookings.filter(b => isPastBooking(b.booking_date, b.booking_time));
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
            </CardContent>
          </Card>

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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Servicios</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
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
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>}

                {/* Past Bookings */}
                {pastBookings.length > 0 && <div>
                    <h3 className="text-lg font-semibold mb-4">Reservas Pasadas</h3>
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
                  </div>}

                {bookings.length === 0 && <p className="text-center text-muted-foreground py-8">No tienes reservas aún</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedBookingId && user && <RatingDialog bookingId={selectedBookingId} userId={user.id} open={ratingDialogOpen} onOpenChange={setRatingDialogOpen} onRatingSubmitted={handleRatingSubmitted} />}
    </div>;
}