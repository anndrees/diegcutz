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
import { ArrowLeft, LogOut, Calendar } from "lucide-react";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
  created_at: string;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");

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
  }, [user, profile, navigate]);

  const fetchBookings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!fullName.trim() || !contactValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        contact_method: contactMethod,
        contact_value: contactValue,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const currentBookings = bookings.filter(b => !isPastBooking(b.booking_date, b.booking_time));
  const pastBookings = bookings.filter(b => isPastBooking(b.booking_date, b.booking_time));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
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
              {editing ? (
                <>
                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactMethod">Método de Contacto</Label>
                    <Select value={contactMethod} onValueChange={setContactMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contactValue">
                      {contactMethod === "email" ? "Email" : "Teléfono"}
                    </Label>
                    <Input
                      id="contactValue"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      type={contactMethod === "email" ? "email" : "tel"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile}>Guardar</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">{profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{profile?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Contacto</p>
                    <p className="font-medium capitalize">{profile?.contact_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {profile?.contact_method === "email" ? "Email" : "Teléfono"}
                    </p>
                    <p className="font-medium">{profile?.contact_value}</p>
                  </div>
                  <Button onClick={() => setEditing(true)}>Editar Perfil</Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate("/booking")}
                className="w-full flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Nueva Reserva
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reservas Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No tienes reservas actuales
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.booking_time}</TableCell>
                      <TableCell>
                        {Array.isArray(booking.services) && booking.services.length > 0
                          ? booking.services.join(", ")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{booking.total_price}€</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historial de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {pastBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No tienes reservas pasadas
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.booking_time}</TableCell>
                      <TableCell>
                        {Array.isArray(booking.services) && booking.services.length > 0
                          ? booking.services.join(", ")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{booking.total_price}€</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
