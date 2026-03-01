import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addHours, parseISO, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Edit2, Trash2, LogOut, Search, CalendarIcon, ExternalLink, X, RotateCcw, CheckCircle, Music, Timer, Scissors, CreditCard, QrCode } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { StatisticsSection } from "@/components/admin/StatisticsSection";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { ClientsManagement } from "@/components/admin/ClientsManagement";
import { BusinessHoursManagement } from "@/components/admin/BusinessHoursManagement";
import { SpecialHoursManagement } from "@/components/admin/SpecialHoursManagement";
import { RatingsManagement } from "@/components/admin/RatingsManagement";
import { GiveawaysManagement } from "@/components/admin/GiveawaysManagement";
import { AdminActionsLog } from "@/components/admin/AdminActionsLog";
import { AdminMessagesSection } from "@/components/admin/AdminMessagesSection";
import { AchievementsManagement } from "@/components/admin/AchievementsManagement";
import { CouponsManagement } from "@/components/admin/CouponsManagement";
import { NotificationsDropdown } from "@/components/admin/NotificationsDropdown";
import { NotificationHistoryManagement } from "@/components/admin/NotificationHistoryManagement";
import { SettingsModal } from "@/components/admin/SettingsModal";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { QrScanner } from "@/components/admin/QrScanner";
import { ActiveAppointmentBanner } from "@/components/admin/ActiveAppointmentBanner";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_contact: string;
  services: string[];
  total_price: number;
  user_id?: string | null;
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  playlist_url?: string | null;
  profile?: {
    full_name: string;
    username: string;
    contact_value: string;
  } | null;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null);
  const [cancelMode, setCancelMode] = useState<"cancel" | "reschedule">("cancel");
  const [activeTab, setActiveTab] = useState("bookings");
  const [showQrScanner, setShowQrScanner] = useState(false);

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
  const openDeleteConfirm = (id: string) => {
    setDeletingBookingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingBookingId) return;

    const { error } = await supabase.from("bookings").delete().eq("id", deletingBookingId);

    setShowDeleteConfirm(false);
    setDeletingBookingId(null);

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

  const openCancelDialog = (booking: Booking, mode: "cancel" | "reschedule") => {
    setCancelDialogBooking(booking);
    setCancelMode(mode);
  };

  const handleReactivateBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({
        is_cancelled: false,
        cancelled_at: null,
        cancelled_by: null,
      })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo reactivar la reserva",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva reactivada",
      description: "La reserva ha sido reactivada correctamente",
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

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div 
        className={`border rounded-xl p-4 transition-all ${booking.is_cancelled ? "border-destructive/30 bg-destructive/5" : "border-border hover:border-primary/30"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-center shrink-0">
              <p className={`text-lg font-bold ${booking.is_cancelled ? "text-destructive" : "text-foreground"}`}>
                {booking.booking_time.slice(0, 5)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(booking.booking_date + "T00:00:00"), "d MMM", { locale: es })}
              </p>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold truncate ${booking.is_cancelled ? "text-destructive line-through" : ""}`}>
                {booking.user_id && booking.profile ? (
                  <Link 
                    to={`/admin/client/${booking.user_id}`}
                    className="text-neon-cyan hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {booking.profile.full_name}
                  </Link>
                ) : booking.client_name}
              </p>
              {booking.is_cancelled && <span className="text-xs font-bold text-destructive">CANCELADA</span>}
              <div className="flex gap-1 flex-wrap mt-1">
                {booking.services?.slice(0, 2).map((s, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{s}</span>
                ))}
                {booking.services && booking.services.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{booking.services.length - 2}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {booking.playlist_url && (
              <a href={booking.playlist_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <Music className="h-4 w-4 text-neon-cyan" />
              </a>
            )}
            <span className={`text-lg font-bold ${booking.is_cancelled ? "text-destructive line-through" : "text-neon-purple"}`}>
              {booking.total_price}€
            </span>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-muted-foreground">
              📞 {booking.user_id && booking.profile ? booking.profile.contact_value : booking.client_contact}
            </p>
            <div className="text-sm">
              {booking.services?.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {booking.is_cancelled ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleReactivateBooking(booking.id)} className="text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" /> Reactivar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCancelDialog(booking, "reschedule")} className="text-neon-cyan border-neon-cyan/30">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reubicar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDeleteConfirm(booking.id)} className="text-destructive border-destructive/30">
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(booking)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCancelDialog(booking, "cancel")} className="text-yellow-500 border-yellow-500/30">
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDeleteConfirm(booking.id)} className="text-destructive border-destructive/30">
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente de tabla reutilizable
  const BookingsTable = ({ bookings: bookingsToShow }: { bookings: Booking[] }) => (
    <>
      {bookingsToShow.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay reservas {searchQuery ? "que coincidan con la búsqueda" : "registradas"}
        </p>
      ) : isMobile ? (
        <div className="space-y-3">
          {bookingsToShow.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
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
              <TableHead>🎵</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsToShow.map((booking) => (
              <TableRow 
                key={booking.id}
                className={booking.is_cancelled ? "bg-destructive/10" : ""}
              >
                <TableCell className={booking.is_cancelled ? "text-destructive" : ""}>
                  {format(new Date(booking.booking_date + "T00:00:00"), "d MMM yyyy", { locale: es })}
                  {booking.is_cancelled && (
                    <span className="block text-xs font-medium">CANCELADA</span>
                  )}
                </TableCell>
                <TableCell className={booking.is_cancelled ? "text-destructive line-through" : ""}>
                  {booking.booking_time.slice(0, 5)}
                </TableCell>
                <TableCell className={`font-medium ${booking.is_cancelled ? "text-destructive" : ""}`}>
                  {booking.user_id && booking.profile ? (
                    <Link 
                      to={`/admin/client/${booking.user_id}`}
                      className={`flex items-center gap-1 ${booking.is_cancelled ? "text-destructive" : "text-neon-cyan"} hover:underline`}
                    >
                      {booking.profile.full_name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    booking.client_name
                  )}
                </TableCell>
                <TableCell className={booking.is_cancelled ? "text-destructive" : ""}>
                  {booking.user_id && booking.profile ? booking.profile.contact_value : booking.client_contact}
                </TableCell>
                <TableCell>
                  <div className={`text-sm max-w-xs ${booking.is_cancelled ? "text-destructive line-through" : ""}`}>
                    {booking.services && booking.services.length > 0 ? (
                      booking.services.map((service, idx) => (
                        <div key={idx} className="text-xs truncate">{service}</div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Sin servicios</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`font-bold ${booking.is_cancelled ? "text-destructive line-through" : ""}`}>
                  {booking.total_price}€
                </TableCell>
                <TableCell>
                  {booking.playlist_url && (
                    <a href={booking.playlist_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" title="Abrir Playlist" className="text-neon-cyan hover:text-neon-cyan/80">
                        <Music className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {booking.is_cancelled ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleReactivateBooking(booking.id)} title="Reactivar reserva">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCancelDialog(booking, "reschedule")} title="Reubicar reserva">
                        <RotateCcw className="h-4 w-4 text-neon-cyan" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(booking.id)} title="Eliminar permanentemente">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(booking)} title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCancelDialog(booking, "cancel")} title="Cancelar reserva">
                        <X className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(booking.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
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
    <div className="min-h-screen py-12 px-4 pt-safe">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="hidden lg:flex">
            <ArrowLeft className="mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant="outline" 
              onClick={() => setShowQrScanner(true)}
              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              <span className="hidden sm:inline mr-2">Escanear QR</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
            </Button>
            <SettingsModal />
            <NotificationsDropdown />
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-5xl font-black mb-2 lg:mb-4 text-neon-cyan">
            PANEL DE ADMINISTRACIÓN
          </h1>
          <p className="text-sm lg:text-xl text-muted-foreground">
            Gestiona todas las reservas, servicios y estadísticas
          </p>
        </div>

        {/* Active Appointment Banner */}
        <ActiveAppointmentBanner onOpenQrScanner={() => setShowQrScanner(true)} />

        {/* Layout with Sidebar */}
        <div className="flex gap-6">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              </div>
            )}

            {activeTab === "statistics" && <StatisticsSection bookings={bookings} />}

            {activeTab === "services" && <ServicesManagement />}

            {activeTab === "clients" && <ClientsManagement />}

            {activeTab === "hours" && (
              <div className="space-y-6">
                <BusinessHoursManagement />
                <SpecialHoursManagement />
              </div>
            )}

            {activeTab === "ratings" && <RatingsManagement />}

            {activeTab === "achievements" && <AchievementsManagement />}

            {activeTab === "coupons" && <CouponsManagement />}

            {activeTab === "giveaways" && <GiveawaysManagement />}

            {activeTab === "messages" && <AdminMessagesSection />}

            {activeTab === "notifications" && <NotificationHistoryManagement />}

            {activeTab === "logs" && <AdminActionsLog />}
          </main>
        </div>

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

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Eliminar Reserva"
          description="¿Seguro que quieres eliminar esta reserva permanentemente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          variant="destructive"
        />

        {/* Cancel/Reschedule Dialog */}
        {cancelDialogBooking && (
          <CancelBookingDialog
            open={!!cancelDialogBooking}
            onOpenChange={(open) => !open && setCancelDialogBooking(null)}
            booking={cancelDialogBooking}
            onSuccess={loadBookings}
            mode={cancelMode}
            isAdmin={true}
          />
        )}

        {/* QR Scanner */}
        <QrScanner open={showQrScanner} onOpenChange={setShowQrScanner} />
      </div>
    </div>
  );
};

export default Admin;
