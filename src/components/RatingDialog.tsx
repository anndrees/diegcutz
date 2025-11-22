import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RatingDialogProps = {
  bookingId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRatingSubmitted: () => void;
};

export const RatingDialog = ({ bookingId, userId, open, onOpenChange, onRatingSubmitted }: RatingDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una valoración",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("ratings").insert({
      booking_id: bookingId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la valoración",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Valoración enviada!",
      description: "Gracias por tu valoración",
    });

    setRating(0);
    setComment("");
    onOpenChange(false);
    onRatingSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valora tu experiencia</DialogTitle>
          <DialogDescription>
            ¿Cómo fue tu visita a la barbería?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <Textarea
              placeholder="Cuéntanos sobre tu experiencia (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0} variant="neon">
            {loading ? "Guardando..." : "Enviar Valoración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
