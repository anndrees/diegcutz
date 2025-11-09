import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Edit2, Trash2, LogOut } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_contact: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    date: new Date(),
    time: "",
    name: "",
    contact: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "diego" && password === "Diegcutz2025") {
      setIsAuthenticated(true);
      toast({
        title: "Bienvenido",
        description: "Sesión iniciada correctamente",
      });
    } else {
      toast({
        title: "Error",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    setLoading(false);

    if (error) {
      console.error("Error loading bookings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive",
      });
      return;
    }

    setBookings(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta reserva?")) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reserva",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva eliminada",
      description: "La reserva se eliminó correctamente",
    });
    
    loadBookings();
  };

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      date: new Date(booking.booking_date + "T00:00:00"),
      time: booking.booking_time,
      name: booking.client_name,
      contact: booking.client_contact,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: format(editForm.date, "yyyy-MM-dd"),
        booking_time: editForm.time,
        client_name: editForm.name,
        client_contact: editForm.contact,
      })
      .eq("id", editingBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la reserva. Es posible que esa hora ya esté ocupada.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva actualizada",
      description: "Los cambios se guardaron correctamente",
    });

    setEditingBooking(null);
    loadBookings();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8"
          >
            <ArrowLeft className="mr-2" />
            Volver
          </Button>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-black text-neon-purple">
                ADMIN PANEL
              </CardTitle>
              <CardDescription>
                Acceso solo para administradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                  />
                </div>

                <Button type="submit" variant="neon" className="w-full">
                  Iniciar Sesión
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2" />
            Volver
          </Button>
          
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 text-neon-cyan">
            PANEL DE ADMINISTRACIÓN
          </h1>
          <p className="text-xl text-muted-foreground">
            Gestiona todas las reservas
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Reservas</CardTitle>
              <Button onClick={loadBookings} disabled={loading}>
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay reservas registradas
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {format(new Date(booking.booking_date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                      <TableCell className="font-medium">{booking.client_name}</TableCell>
                      <TableCell>{booking.client_contact}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(booking)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(booking.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
              <DialogDescription>
                Modifica los datos de la reserva
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Fecha</Label>
                  <div className="flex justify-center mt-2">
                    <Calendar
                      mode="single"
                      selected={editForm.date}
                      onSelect={(date) => date && setEditForm({ ...editForm, date })}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border border-border pointer-events-auto"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-time">Hora</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-contact">Contacto</Label>
                  <Input
                    id="edit-contact"
                    value={editForm.contact}
                    onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingBooking(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="neon">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
