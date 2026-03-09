import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Star, MessageSquare } from "lucide-react";

export const MembershipSurvey = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [membershipId, setMembershipId] = useState<string | null>(null);

  useEffect(() => {
    checkSurveyEligibility();
  }, [user]);

  const checkSurveyEligibility = async () => {
    if (!user) return;

    // Check if user has an active membership
    const { data: sub } = await supabase
      .from("user_memberships")
      .select("membership_id, start_date")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) return;
    setMembershipId(sub.membership_id);

    // Check if last survey was more than 90 days ago
    const { data: lastSurvey } = await supabase
      .from("membership_surveys")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSurvey) {
      const daysSince = Math.ceil((Date.now() - new Date(lastSurvey.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 90) return;
    } else {
      // First survey - check if membership is at least 30 days old
      const memberDays = Math.ceil((Date.now() - new Date(sub.start_date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
      if (memberDays < 30) return;
    }

    setShow(true);
  };

  const handleSubmit = async () => {
    if (!user || !membershipId || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("membership_surveys").insert({
      user_id: user.id,
      membership_id: membershipId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: "No se pudo enviar la encuesta", variant: "destructive" });
    } else {
      toast({ title: "¡Gracias!", description: "Tu opinión nos ayuda a mejorar" });
      setShow(false);
    }
    setSubmitting(false);
  };

  if (!show) return null;

  return (
    <Card className="mb-6 border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
          ¿Cómo va tu membresía?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Tu opinión nos ayuda a mejorar. ¿Qué tal la experiencia?</p>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} onClick={() => setRating(i)} className="p-1 transition-transform hover:scale-110">
              <Star className={`h-7 w-7 ${i <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-muted-foreground/30"}`} />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="¿Algún comentario? (opcional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="min-h-[60px]"
        />

        <div className="flex gap-2">
          <Button size="sm" className="bg-[#D4AF37] hover:bg-[#B8860B] text-background" onClick={handleSubmit} disabled={rating === 0 || submitting}>
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShow(false)}>Ahora no</Button>
        </div>
      </CardContent>
    </Card>
  );
};
