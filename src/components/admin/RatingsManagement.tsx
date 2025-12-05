import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  booking_id: string;
  profile: {
    username: string;
    full_name: string;
  } | null;
  booking: {
    services: string[];
    booking_date: string;
  } | null;
};

export const RatingsManagement = () => {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ratings")
      .select(`
        *,
        profile:profiles(username, full_name),
        booking:bookings(services, booking_date)
      `)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las valoraciones",
        variant: "destructive",
      });
      return;
    }

    const formattedRatings = (data || []).map(r => ({
      ...r,
      profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
      booking: Array.isArray(r.booking) ? r.booking[0] : r.booking,
    })) as Rating[];

    setRatings(formattedRatings);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta valoración?")) return;

    const { error } = await supabase.from("ratings").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la valoración",
        variant: "destructive",
      });
      return;
    }

    // Log action
    const rating = ratings.find(r => r.id === id);
    await supabase.from("admin_action_logs").insert({
      action_type: "DELETE_RATING",
      description: `Eliminó valoración de ${rating?.profile?.full_name || "usuario desconocido"}`,
      target_user_id: rating?.user_id,
      target_user_name: rating?.profile?.full_name,
    });

    toast({
      title: "Valoración eliminada",
      description: "La valoración se eliminó correctamente",
    });

    loadRatings();
  };

  const avgRating = ratings.length > 0
    ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Valoraciones</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {ratings.length} valoraciones · Media: {avgRating} ⭐
            </p>
          </div>
          <Button onClick={loadRatings} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {ratings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay valoraciones registradas
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratings.map((rating) => (
                <TableRow key={rating.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{rating.profile?.full_name || "Desconocido"}</p>
                      <p className="text-xs text-muted-foreground">
                        @{rating.profile?.username || "anónimo"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= rating.rating
                              ? "fill-neon-cyan text-neon-cyan"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate text-sm">
                      {rating.comment || <span className="text-muted-foreground">Sin comentario</span>}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs max-w-xs">
                      {rating.booking?.services?.slice(0, 2).map((s, i) => (
                        <span key={i} className="block truncate">{s}</span>
                      ))}
                      {rating.booking?.services && rating.booking.services.length > 2 && (
                        <span className="text-muted-foreground">
                          +{rating.booking.services.length - 2} más
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(rating.created_at), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rating.id)}
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
  );
};
