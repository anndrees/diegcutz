import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Edit2, Trash2, LogOut, Search, CalendarIcon, ExternalLink } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatisticsSection } from "@/components/admin/StatisticsSection";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { ClientsManagement } from "@/components/admin/ClientsManagement";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_contact: string;
  services: string[];
  total_price: number;
  user_id?: string | null;
  profile?: {
    full_name: string;
    username: string;
    contact_value: string;
  } | null;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("adminAuth") === "true";
  });
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>();
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "diego" && password === "DiegCutz#2025Pro") {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
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
    sessionStorage.removeItem("adminAuth");
    setUsername("");
    setPassword("");
  };

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profile:profiles(full_name, username, contact_value)
      `)
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

    setBookings((data || []).map(booking => ({
      ...booking,
      services: Array.isArray(booking.services) ? (booking.services as string[]) : [],
      profile: Array.isArray(booking.profile) ? booking.profile[0] : booking.profile
    })));
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

  // Función para verificar si una reserva es pasada (2 horas después de la hora de reserva)
  const isPastBooking = (booking: Booking) => {
    const bookingDateTime = parseISO(`${booking.booking_date}T${booking.booking_time}`);
    const twoHoursAfter = addHours(bookingDateTime, 2);
    return new Date() > twoHoursAfter;
  };

  // Filtrar reservas actuales y pasadas
  const currentBookings = bookings.filter(booking => !isPastBooking(booking) && 
    booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const pastBookings = bookings.filter(booking => isPastBooking(booking) && 
    booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Obtener fechas con reservas para el calendario
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentDatesWithBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.booking_date + "T00:00:00");
      return bookingDate >= today;
    })
    .map(booking => new Date(booking.booking_date + "T00:00:00"));

  const pastDatesWithBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.booking_date + "T00:00:00");
      return bookingDate < today;
    })
    .map(booking => new Date(booking.booking_date + "T00:00:00"));

  // Obtener reservas del día seleccionado en el calendario
  const bookingsForSelectedDate = selectedCalendarDate
    ? bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date + "T00:00:00");
        return bookingDate.toDateString() === selectedCalendarDate.toDateString();
      })
    : [];

  // Componente de tabla reutilizable
  const BookingsTable = ({ bookings: bookingsToShow }: { bookings: Booking[] }) => (
    <>
      {bookingsToShow.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay reservas {searchQuery ? "que coincidan con la búsqueda" : "registradas"}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsToShow.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  {format(new Date(booking.booking_date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                <TableCell className="font-medium">
                  {booking.user_id && booking.profile ? (
                    <Link 
                      to={`/admin/client/${booking.user_id}`}
                      className="flex items-center gap-1 text-neon-cyan hover:underline"
                    >
                      {booking.profile.full_name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    booking.client_name
                  )}
                </TableCell>
                <TableCell>
                  {booking.user_id && booking.profile ? booking.profile.contact_value : booking.client_contact}
                </TableCell>
                <TableCell>
                  <div className="text-sm max-w-xs">
                    {booking.services && booking.services.length > 0 ? (
                      booking.services.map((service, idx) => (
                        <div key={idx} className="text-xs truncate">{service}</div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Sin servicios</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{booking.total_price}€</TableCell>
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
    </>
  );

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
            Gestiona todas las reservas, servicios y estadísticas
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="bookings" className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Calendario Visual */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendario de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedCalendarDate}
                onSelect={(date) => {
                  setSelectedCalendarDate(date);
                  if (date) setShowCalendarDialog(true);
                }}
                className="rounded-md border border-border pointer-events-auto"
                modifiers={{
                  currentBooking: currentDatesWithBookings,
                  pastBooking: pastDatesWithBookings,
                }}
                modifiersClassNames={{
                  currentBooking: "bg-neon-purple text-white font-bold rounded-full",
                  pastBooking: "bg-muted text-muted-foreground font-bold rounded-full",
                }}
              />
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neon-purple/10 rounded-lg">
                  <p className="text-3xl font-bold text-neon-purple">{currentBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Reservas Actuales</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-muted-foreground">{pastBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Reservas Pasadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-2xl">Reservas</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-[250px]"
                  />
                </div>
                <Button onClick={loadBookings} disabled={loading}>
                  {loading ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">
                  Actuales ({currentBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Pasadas ({pastBookings.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="mt-4">
                <BookingsTable bookings={currentBookings} />
              </TabsContent>
              <TabsContent value="past" className="mt-4">
                <BookingsTable bookings={pastBookings} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsSection bookings={bookings} />
          </TabsContent>

          <TabsContent value="services">
            <ServicesManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsManagement />
          </TabsContent>
        </Tabs>

        {/* Dialog para mostrar reservas del día seleccionado */}
        <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Reservas del {selectedCalendarDate && format(selectedCalendarDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </DialogTitle>
              <DialogDescription>
                {bookingsForSelectedDate.length} reserva{bookingsForSelectedDate.length !== 1 ? 's' : ''} para este día
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {bookingsForSelectedDate.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay reservas para este día
                </p>
              ) : (
                <div className="space-y-3">
                  {bookingsForSelectedDate.map((booking) => (
                    <Card key={booking.id} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-bold text-lg">{booking.client_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.client_contact}</p>
                            <p className="text-sm">
                              <span className="font-semibold">Hora:</span> {booking.booking_time.slice(0, 5)}
                            </p>
                            <div className="text-sm">
                              <span className="font-semibold">Servicios:</span>
                              <div className="mt-1">
                                {booking.services && booking.services.length > 0 ? (
                                  booking.services.map((service, idx) => (
                                    <div key={idx} className="text-xs">{service}</div>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">Sin servicios</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-neon-purple">{booking.total_price}€</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
