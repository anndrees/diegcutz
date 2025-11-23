import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Package, Sparkles, LogIn } from "lucide-react";


type Pack = {
  id: string;
  name: string;
  price: number;
  description?: string;
  included_service_ids?: string[];
  coming_soon?: boolean;
};

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  coming_soon?: boolean;
};

const HOURS = {
  monday: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  tuesday: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  wednesday: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  thursday: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  friday: [11, 12, 13, 14, 15, 16],
  saturday: [11, 12, 13, 14, 15, 16, 17],
  sunday: [],
};

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Load services and packs from database
  useEffect(() => {
    loadServicesFromDB();
  }, []);

  const loadServicesFromDB = async () => {
    setLoadingServices(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading services:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
      setLoadingServices(false);
      return;
    }

    if (data) {
      const dbServices = data.filter(s => s.service_type === 'service' && !s.coming_soon).map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price.toString()),
        description: s.description || undefined,
        coming_soon: s.coming_soon || false,
      }));
      const dbPacks = data.filter(s => s.service_type === 'pack' && !s.coming_soon).map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price.toString()),
        description: s.description || undefined,
        included_service_ids: s.included_service_ids || [],
        coming_soon: s.coming_soon || false,
      }));
      
      setServices(dbServices);
      setPacks(dbPacks);
    }
    setLoadingServices(false);
  };

  // Restore booking state from localStorage if redirected from auth
  useEffect(() => {
    const savedBookingState = localStorage.getItem("pendingBooking");
    if (savedBookingState && user) {
      const state = JSON.parse(savedBookingState);
      setSelectedDate(state.date ? new Date(state.date) : undefined);
      setSelectedTime(state.time || "");
      setSelectedServices(state.services || []);
      setSelectedPack(state.pack || null);
      localStorage.removeItem("pendingBooking");
      
      // Check if the saved time is still available
      if (state.date && state.time) {
        checkTimeAvailability(new Date(state.date), state.time);
      }
    }
  }, [user]);

  const checkTimeAvailability = async (date: Date, time: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", format(date, "yyyy-MM-dd"));

    if (!error && data) {
      const bookedTimesForDate = data.map((b) => b.booking_time);
      if (bookedTimesForDate.includes(time)) {
        toast({
          title: "Hora no disponible",
          description: "La hora que habías seleccionado ya no está disponible. Por favor selecciona otra.",
          variant: "destructive",
        });
        setSelectedTime("");
        setSelectedDate(undefined);
        setSelectedServices([]);
        setSelectedPack(null);
      }
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadBookedTimes();
    }
  }, [selectedDate]);

  const loadBookedTimes = async () => {
    if (!selectedDate) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", format(selectedDate, "yyyy-MM-dd"));

    if (error) {
      console.error("Error loading bookings:", error);
      return;
    }

    setBookedTimes(data.map((b) => b.booking_time));
  };

  const getAvailableHours = () => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayOfWeek] as keyof typeof HOURS;
    
    return HOURS[dayName];
  };

  const handlePackChange = (packId: string) => {
    if (selectedPack === packId) {
      setSelectedPack(null);
      return;
    }
    setSelectedPack(packId);
    // Remove services included in the pack
    const pack = packs.find(p => p.id === packId);
    if (pack && pack.included_service_ids) {
      setSelectedServices(selectedServices.filter(s => !pack.included_service_ids!.includes(s)));
    }
  };

  const handleServiceChange = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const isServiceDisabled = (serviceId: string) => {
    if (!selectedPack) return false;
    const pack = packs.find(p => p.id === selectedPack);
    return pack && pack.included_service_ids ? pack.included_service_ids.includes(serviceId) : false;
  };

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPack) {
      const pack = packs.find(p => p.id === selectedPack);
      if (pack) total += pack.price;
    }
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) total += service.price;
    });
    
    return total;
  };

  const getSelectedItems = () => {
    const items: string[] = [];
    
    if (selectedPack) {
      const pack = packs.find(p => p.id === selectedPack);
      if (pack) items.push(`${pack.name} (${pack.price}€)`);
    }
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) items.push(`${service.name} (${service.price}€)`);
    });
    
    return items;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user || !profile) {
      // Save booking state to localStorage
      const bookingState = {
        date: selectedDate?.toISOString(),
        time: selectedTime,
        services: selectedServices,
        pack: selectedPack,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingState));
      
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para completar tu reserva",
      });
      
      navigate("/auth", { state: { from: "/booking" } });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Por favor selecciona fecha y hora",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPack && selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un servicio o pack",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const totalPrice = calculateTotal();
    const servicesData = getSelectedItems();

    const { error } = await supabase.from("bookings").insert({
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      client_name: profile.full_name,
      client_contact: profile.contact_value,
      services: servicesData,
      total_price: totalPrice,
      user_id: user.id,
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Esta hora ya está reservada. Por favor elige otra.",
        variant: "destructive",
      });
      loadBookedTimes();
      return;
    }

    // Send email notification
    try {
      await supabase.functions.invoke('send-booking-email', {
        body: {
          clientName: profile.full_name,
          clientContact: profile.contact_value,
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          bookingTime: selectedTime,
          services: servicesData,
          totalPrice,
        },
      });
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
    }

    setLoading(false);

    toast({
      title: "¡Reserva confirmada!",
      description: `Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}. Total: ${totalPrice}€`,
    });

    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedServices([]);
    setSelectedPack(null);
  };

  const availableHours = getAvailableHours();
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Volver
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-purple font-aggressive">
            RESERVA TU CITA
          </h1>
          <p className="text-xl text-muted-foreground">
            Elige tu fecha, hora y servicios
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Selecciona una fecha</CardTitle>
              <CardDescription>Los domingos estamos cerrados</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border border-border pointer-events-auto scale-90 sm:scale-100"
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <div className="space-y-6">
            {selectedDate && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Clock className="text-secondary" />
                    Horas disponibles
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableHours.length === 0 ? (
                    <p className="text-destructive">Cerrado este día</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableHours.map((hour) => {
                        const timeString = `${hour.toString().padStart(2, "0")}:00:00`;
                        const isBooked = bookedTimes.includes(timeString);
                        
                        return (
                          <Button
                            key={hour}
                            variant={selectedTime === timeString ? "neon" : "outline"}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(timeString)}
                            className={`h-10 sm:h-12 text-sm sm:text-base relative ${
                              isBooked ? 'opacity-50' : ''
                            }`}
                          >
                            {isBooked && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </span>
                            )}
                            <span className={isBooked ? 'opacity-30' : ''}>{hour}:00</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Services Selection */}
        {selectedTime && !loadingServices && (
          <div className="mt-8 space-y-6">
            {/* Packs */}
            {packs.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Package className="text-neon-cyan" />
                    Selecciona un Pack
                  </CardTitle>
                  <CardDescription>Solo puedes seleccionar un pack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {packs.map((pack) => (
                    <div key={pack.id}>
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPack === pack.id
                            ? 'border-neon-cyan bg-card/50 glow-neon-cyan'
                            : selectedPack && selectedPack !== pack.id
                            ? 'border-muted opacity-50'
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => handlePackChange(pack.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-neon-cyan">{pack.name}</h4>
                            {pack.included_service_ids && pack.included_service_ids.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Incluye: {pack.included_service_ids.map(sid => 
                                  services.find(s => s.id === sid)?.name
                                ).filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="text-xl font-bold text-primary">{pack.price}€</span>
                        </div>
                      </div>
                      
                      {/* Show coming soon facial mask only for selected packs */}
                      {selectedPack === pack.id && (
                        <div className="mt-2 p-3 border-2 border-dashed border-muted rounded-lg opacity-60">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-semibold text-sm">¿Añadir mascarilla facial?</h5>
                              <p className="text-xs text-muted-foreground mt-0.5">1.50€</p>
                            </div>
                            <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded">
                              Próximamente
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Servicios Adicionales
                  </CardTitle>
                  <CardDescription>Puedes seleccionar varios servicios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.map((service) => {
                    const disabled = isServiceDisabled(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg ${
                          disabled
                            ? 'opacity-50 border-muted'
                            : selectedServices.includes(service.id)
                            ? 'border-primary bg-card/50 glow-neon-purple'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceChange(service.id)}
                            disabled={disabled}
                          />
                          <Label
                            htmlFor={service.id}
                            className={`text-base cursor-pointer ${disabled ? 'line-through' : ''}`}
                          >
                            {service.name}
                          </Label>
                        </div>
                        <span className="text-lg font-bold">{service.price}€</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Total Price */}
            {(selectedPack || selectedServices.length > 0) && (
              <Card className="bg-gradient-neon border-0">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center text-background">
                    <span className="text-2xl font-black">TOTAL:</span>
                    <span className="text-4xl font-black">{totalPrice}€</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Info / Login Prompt */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">
                  {user && profile ? "Tu perfil" : "Inicia sesión"}
                </CardTitle>
                <CardDescription>
                  {user && profile 
                    ? "Información de tu cuenta" 
                    : "Debes iniciar sesión para completar tu reserva"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authLoading ? (
                  <p className="text-center py-4">Cargando...</p>
                ) : user && profile ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="text-lg font-semibold">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto</p>
                      <p className="text-lg font-semibold">{profile.contact_value}</p>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      variant="neonCyan"
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      disabled={loading || (!selectedPack && selectedServices.length === 0)}
                    >
                      {loading ? "Reservando..." : `Confirmar Reserva - ${totalPrice}€`}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const bookingState = {
                        date: selectedDate?.toISOString(),
                        time: selectedTime,
                        services: selectedServices,
                        pack: selectedPack,
                      };
                      localStorage.setItem("pendingBooking", JSON.stringify(bookingState));
                      navigate("/auth", { state: { from: "/booking" } });
                    }}
                    variant="neon"
                    className="w-full h-10 sm:h-12 text-sm sm:text-base"
                  >
                    <LogIn className="mr-2" />
                    Iniciar Sesión / Registrarse
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
