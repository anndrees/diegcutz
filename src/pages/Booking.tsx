import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock } from "lucide-react";

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
  const [clientContact, setClientContact] = useState("");
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

    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      client_name: clientName,
      client_contact: clientContact,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Esta hora ya está reservada. Por favor elige otra.",
        variant: "destructive",
      });
      loadBookedTimes();
      return;
    }

    toast({
      title: "¡Reserva confirmada!",
      description: `Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}`,
    });

    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setClientName("");
    setClientContact("");
  };

  const availableHours = getAvailableHours();

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
          <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-purple">
            RESERVA TU CITA
          </h1>
          <p className="text-xl text-muted-foreground">
            Elige tu fecha y hora preferida
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

          {/* Time Selection & Form */}
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

            {selectedTime && (
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
                      <Label htmlFor="contact" className="text-sm md:text-base">Teléfono o Email</Label>
                      <Input
                        id="contact"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        placeholder="Tu contacto"
                        className="text-sm md:text-base"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="neonCyan"
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? "Reservando..." : "Confirmar Reserva"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
