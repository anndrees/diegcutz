import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Package, Sparkles, LogIn, Gift } from "lucide-react";

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

type TimeRange = {
  start: string;
  end: string;
};

type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, checkAccountStatus, signOut } = useAuth();
  const isMobile = useIsMobile();
  const hoursRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isFreeCutReservation, setIsFreeCutReservation] = useState(false);
  const [restrictionTimeLeft, setRestrictionTimeLeft] = useState<string>("");

  // Check account status on mount and periodically
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
        return;
      }
      
      if (status.isRestricted && status.restrictionEndsAt) {
        const endTime = new Date(status.restrictionEndsAt);
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setRestrictionTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-scroll to hours section on mobile when date is selected
  useEffect(() => {
    if (selectedDate && isMobile && hoursRef.current) {
      setTimeout(() => {
        hoursRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate, isMobile]);

  // Check if this is a free cut reservation from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("free_cut") === "true") {
      setIsFreeCutReservation(true);
    }
  }, [location.search]);

  // Load services, packs and business hours from database
  useEffect(() => {
    loadServicesFromDB();
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week");

    if (!error && data) {
      const formatted = data.map(d => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : []
      }));
      setBusinessHours(formatted);
    }
  };

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
      // Services - show ALL but mark coming_soon ones
      const dbServices = data.filter(s => s.service_type === 'service').map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price.toString()),
        description: s.description || undefined,
        coming_soon: s.coming_soon || false,
      }));
      
      // Packs - show ALL but mark coming_soon ones
      const dbPacks = data.filter(s => s.service_type === 'pack').map(s => ({
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

  const getAvailableHours = (): number[] => {
    if (!selectedDate || businessHours.length === 0) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!dayConfig || dayConfig.is_closed) return [];
    
    if (dayConfig.is_24h) {
      // Return all hours except 23 (since reservation lasts 1 hour)
      return Array.from({ length: 23 }, (_, i) => i);
    }
    
    const hours: Set<number> = new Set();
    
    dayConfig.time_ranges.forEach(range => {
      const startHour = parseInt(range.start.split(":")[0]);
      const endHour = parseInt(range.end.split(":")[0]);
      
      // Last bookable hour is endHour - 1 (since reservations last 1 hour)
      for (let h = startHour; h < endHour; h++) {
        hours.add(h);
      }
    });
    
    return Array.from(hours).sort((a, b) => a - b);
  };

  const isDayClosed = (date: Date): boolean => {
    if (businessHours.length === 0) return false;
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    return dayConfig?.is_closed ?? false;
  };

  const handlePackChange = (packId: string) => {
    if (isFreeCutReservation) return; // Cannot select packs for free cut
    
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
    // For free cut, DEGRADADO and VACIAR are pre-selected and cannot be deselected
    if (isFreeCutReservation) {
      const service = services.find(s => s.id === serviceId);
      if (service && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
        return; // Cannot toggle these for free cut
      }
    }
    
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

  // Get the IDs of DEGRADADO and VACIAR/TEXTURIZADO services for free cut
  const getFreeCutServiceIds = (): string[] => {
    return services
      .filter(s => s.name.includes("DEGRADADO") || s.name.includes("VACIAR") || s.name.includes("TEXTURIZADO"))
      .map(s => s.id);
  };

  // Auto-select free cut services
  useEffect(() => {
    if (isFreeCutReservation && services.length > 0) {
      const freeCutIds = getFreeCutServiceIds();
      setSelectedServices(prev => {
        const combined = new Set([...prev, ...freeCutIds]);
        return Array.from(combined);
      });
    }
  }, [isFreeCutReservation, services]);

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPack) {
      const pack = packs.find(p => p.id === selectedPack);
      if (pack) total += pack.price;
    }
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        // For free cut, DEGRADADO and VACIAR/TEXTURIZADO are free
        if (isFreeCutReservation && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
          // Free!
        } else {
          total += service.price;
        }
      }
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
      if (service) {
        if (isFreeCutReservation && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
          items.push(`${service.name} (GRATIS - Corte gratis)`);
        } else {
          items.push(`${service.name} (${service.price}€)`);
        }
      }
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

    // Check for restriction
    const status = await checkAccountStatus();
    
    if (status.isBanned) {
      toast({
        title: "Cuenta suspendida",
        description: status.banReason,
        variant: "destructive",
      });
      await signOut();
      navigate("/auth");
      return;
    }
    
    if (status.isRestricted && status.restrictionEndsAt) {
      const endTime = new Date(status.restrictionEndsAt);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        toast({
          title: "No puedes reservar",
          description: `Tu cuenta está temporalmente restringida. Podrás volver a reservar en ${hours}h ${minutes}m ${seconds}s`,
          variant: "destructive",
        });
        return;
      }
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

    // If this is a free cut reservation, deduct from loyalty_rewards
    if (isFreeCutReservation) {
      // Get current free_cuts_available and decrement
      const { data: loyaltyData } = await supabase
        .from("loyalty_rewards")
        .select("free_cuts_available")
        .eq("user_id", user.id)
        .single();

      if (loyaltyData && loyaltyData.free_cuts_available > 0) {
        await supabase
          .from("loyalty_rewards")
          .update({ free_cuts_available: loyaltyData.free_cuts_available - 1 })
          .eq("user_id", user.id);
      }
    }

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
          isFreeCut: isFreeCutReservation,
        },
      });
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
    }

    setLoading(false);

    const message = isFreeCutReservation 
      ? `¡Tu corte gratis está confirmado! Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}.`
      : `Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}. Total: ${totalPrice}€`;

    toast({
      title: "¡Reserva confirmada!",
      description: message,
    });

    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedServices([]);
    setSelectedPack(null);
    setIsFreeCutReservation(false);
    
    // Navigate to home after booking
    navigate("/");
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
          {isFreeCutReservation ? (
            <>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Gift className="h-5 w-5" />
                <span className="font-bold">CORTE GRATIS</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-cyan font-aggressive">
                ¡TU CORTE GRATIS!
              </h1>
              <p className="text-xl text-muted-foreground">
                Incluye DEGRADADO + VACIAR/TEXTURIZADO. Puedes añadir servicios extra.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-purple font-aggressive">
                RESERVA TU CITA
              </h1>
              <p className="text-xl text-muted-foreground">
                Elige tu fecha, hora y servicios
              </p>
            </>
          )}
        </div>

        {/* Restriction Alert */}
        {profile?.is_restricted && restrictionTimeLeft && (
          <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-500 font-bold mb-1">
              <span>⚠️ CUENTA RESTRINGIDA</span>
            </div>
            <p className="text-muted-foreground">
              No puedes hacer reservas temporalmente. Podrás volver a reservar en:{" "}
              <span className="font-mono text-yellow-500">{restrictionTimeLeft}</span>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Selecciona una fecha</CardTitle>
              <CardDescription>Los días marcados como cerrados no están disponibles</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || isDayClosed(date)}
                className="rounded-md border border-border pointer-events-auto scale-90 sm:scale-100"
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <div className="space-y-6" ref={hoursRef}>
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
                                <svg className="w-full h-full text-neon-cyan opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <line x1="4" y1="4" x2="20" y2="20"></line>
                                  <line x1="20" y1="4" x2="4" y2="20"></line>
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
            {/* Packs - Hidden for free cut reservations */}
            {!isFreeCutReservation && packs.length > 0 && (
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
                        className={`p-4 border-2 rounded-lg transition-all ${
                          pack.coming_soon
                            ? 'opacity-60 cursor-not-allowed border-muted'
                            : selectedPack === pack.id
                            ? 'border-neon-cyan bg-card/50 glow-neon-cyan cursor-pointer'
                            : selectedPack && selectedPack !== pack.id
                            ? 'border-muted opacity-50 cursor-pointer'
                            : 'border-border hover:border-primary cursor-pointer'
                        }`}
                        onClick={() => !pack.coming_soon && handlePackChange(pack.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-neon-cyan">{pack.name}</h4>
                              {pack.coming_soon && (
                                <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                                  Próximamente
                                </span>
                              )}
                            </div>
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
                      {selectedPack === pack.id && !pack.coming_soon && (
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
                    {isFreeCutReservation ? "Servicios (DEGRADADO y VACIAR incluidos)" : "Servicios Adicionales"}
                  </CardTitle>
                  <CardDescription>
                    {isFreeCutReservation 
                      ? "Los servicios marcados con ✓ GRATIS están incluidos en tu corte gratis"
                      : "Puedes seleccionar varios servicios"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.map((service) => {
                    const isFreeCutService = isFreeCutReservation && 
                      (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"));
                    const disabled = isServiceDisabled(service.id) || service.coming_soon;
                    
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg ${
                          disabled && !isFreeCutService
                            ? 'opacity-50 border-muted'
                            : isFreeCutService
                            ? 'border-neon-cyan bg-neon-cyan/10'
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
                            disabled={disabled || isFreeCutService}
                          />
                          <Label
                            htmlFor={service.id}
                            className={`text-base cursor-pointer`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{service.name}</span>
                              {isFreeCutService && (
                                <span className="text-xs font-bold text-neon-cyan uppercase bg-neon-cyan/20 px-2 py-0.5 rounded">
                                  ✓ GRATIS
                                </span>
                              )}
                              {service.coming_soon && (
                                <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                                  Próximamente
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                        <span className={`text-lg font-bold ${isFreeCutService ? 'line-through text-muted-foreground' : ''}`}>
                          {service.price}€
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Total Price */}
            {(selectedPack || selectedServices.length > 0) && (
              <Card className={`border-0 ${isFreeCutReservation ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20' : 'bg-gradient-neon'}`}>
                <CardContent className="p-6">
                  <div className={`flex justify-between items-center ${isFreeCutReservation ? 'text-foreground' : 'text-background'}`}>
                    <div>
                      <span className="text-2xl font-black">TOTAL:</span>
                      {isFreeCutReservation && totalPrice === 0 && (
                        <p className="text-sm text-neon-cyan">¡Es tu corte gratis!</p>
                      )}
                    </div>
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
                      variant={isFreeCutReservation ? "neonCyan" : "neonCyan"}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      disabled={loading || (!selectedPack && selectedServices.length === 0)}
                    >
                      {loading ? "Reservando..." : isFreeCutReservation ? `¡Confirmar Corte Gratis!` : `Confirmar Reserva - ${totalPrice}€`}
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
