import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Package, Sparkles } from "lucide-react";
import { SERVICES, PACKS, Service, Pack } from "@/types/booking";

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
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [clientContact, setClientContact] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
    const pack = PACKS.find(p => p.id === packId);
    if (pack) {
      setSelectedServices(selectedServices.filter(s => !pack.includedServices.includes(s)));
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
    const pack = PACKS.find(p => p.id === selectedPack);
    return pack ? pack.includedServices.includes(serviceId) : false;
  };

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPack) {
      const pack = PACKS.find(p => p.id === selectedPack);
      if (pack) total += pack.price;
    }
    
    selectedServices.forEach(serviceId => {
      const service = SERVICES.find(s => s.id === serviceId);
      if (service) total += service.price;
    });
    
    return total;
  };

  const getSelectedItems = () => {
    const items: string[] = [];
    
    if (selectedPack) {
      const pack = PACKS.find(p => p.id === selectedPack);
      if (pack) items.push(`${pack.name} (${pack.price}€)`);
    }
    
    selectedServices.forEach(serviceId => {
      const service = SERVICES.find(s => s.id === serviceId);
      if (service) items.push(`${service.name} (${service.price}€)`);
    });
    
    return items;
  };

  const validateContact = () => {
    if (contactType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(clientContact);
    } else {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return phoneRegex.test(clientContact.replace(/\s/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !clientName || !clientContact) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (!validateContact()) {
      toast({
        title: "Error",
        description: contactType === "email" ? "Email inválido" : "Teléfono inválido",
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
      client_name: clientName,
      client_contact: clientContact,
      services: servicesData,
      total_price: totalPrice,
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
          clientName,
          clientContact,
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
    setClientName("");
    setClientContact("");
    setSelectedServices([]);
    setSelectedPack(null);
    setContactType("phone");
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
                            className="h-10 sm:h-12 text-sm sm:text-base"
                          >
                            {hour}:00
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
        {selectedTime && (
          <div className="mt-8 space-y-6">
            {/* Packs */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  <Package className="text-neon-cyan" />
                  Selecciona un Pack
                </CardTitle>
                <CardDescription>Solo puedes seleccionar un pack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PACKS.map((pack) => (
                  <div
                    key={pack.id}
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
                        <p className="text-sm text-muted-foreground mt-1">
                          Incluye: {pack.includedServices.map(sid => 
                            SERVICES.find(s => s.id === sid)?.name
                          ).join(', ')}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-primary">{pack.price}€</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  Servicios Adicionales
                </CardTitle>
                <CardDescription>Puedes seleccionar varios servicios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SERVICES.map((service) => {
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

            {/* Contact Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Tus datos</CardTitle>
                <CardDescription>
                  Para confirmar la reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm md:text-base">Nombre completo</Label>
                    <Input
                      id="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Tu nombre"
                      className="text-sm md:text-base"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm md:text-base mb-3 block">Método de contacto</Label>
                    <RadioGroup value={contactType} onValueChange={(value) => {
                      setContactType(value as "phone" | "email");
                      setClientContact("");
                    }}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone" className="cursor-pointer">Teléfono</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="cursor-pointer">Email</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="contact" className="text-sm md:text-base">
                      {contactType === "phone" ? "Teléfono" : "Email"}
                    </Label>
                    <Input
                      id="contact"
                      type={contactType === "email" ? "email" : "tel"}
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      placeholder={contactType === "phone" ? "+34 123 456 789" : "tu@email.com"}
                      className="text-sm md:text-base"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="neonCyan"
                    className="w-full h-10 sm:h-12 text-sm sm:text-base"
                    disabled={loading || (!selectedPack && selectedServices.length === 0)}
                  >
                    {loading ? "Reservando..." : `Confirmar Reserva - ${totalPrice}€`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
