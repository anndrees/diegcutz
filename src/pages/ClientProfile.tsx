import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, Package, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
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

interface Profile {
  id: string;
  full_name: string;
  username: string;
  contact_method: string;
  contact_value: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
  created_at: string;
}

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
  });

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

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

    if (bookingsError) {
      console.error("Error loading bookings:", bookingsError);
    } else {
      setBookings(bookingsData || []);
    }

    setLoading(false);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      date: booking.booking_date,
      time: booking.booking_time,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: editForm.date,
        booking_time: editForm.time,
      })
      .eq("id", editingBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la reserva",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Éxito",
      description: "Reserva actualizada correctamente",
    });

    setEditingBooking(null);
    loadClientData();
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta reserva?")) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reserva",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Éxito",
      description: "Reserva eliminada correctamente",
    });

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

  return (
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

        {/* Client Info */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="text-primary" />
              Información del Cliente
            </CardTitle>
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
                              booking.services.map((service, idx) => (
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
                            onClick={() => handleEdit(booking)}
                            title="Editar reserva"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(booking.id)}
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

        {/* Dialog de edición */}
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
              <Button onClick={handleSaveEdit}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClientProfile;
