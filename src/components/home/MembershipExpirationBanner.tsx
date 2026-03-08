import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, MessageCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MembershipExpirationBanner = () => {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [membershipName, setMembershipName] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!user) return;
    loadMembership();
  }, [user]);

  const loadMembership = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_memberships")
      .select("end_date, membership:memberships(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (data) {
      const membership = Array.isArray(data.membership) ? data.membership[0] : data.membership;
      const end = new Date(data.end_date + "T00:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (days <= 10) {
        setDaysLeft(days);
        setMembershipName((membership as any)?.name || "");
        setEndDate(data.end_date);
      }
    }
  };

  if (daysLeft === null) return null;

  const isUrgent = daysLeft <= 4;
  const whatsappUrl = `https://wa.me/34641637576?text=${encodeURIComponent(`¡Hola! Quiero renovar mi membresía "${membershipName}". Mi membresía vence el ${endDate}.`)}`;

  return (
    <div className={`rounded-xl p-4 border-2 ${isUrgent ? "border-destructive bg-destructive/10" : "border-yellow-500 bg-yellow-500/10"}`}>
      <div className="flex items-start gap-3">
        <Crown className={`h-6 w-6 shrink-0 mt-0.5 ${isUrgent ? "text-destructive" : "text-yellow-500"}`} />
        <div className="flex-1">
          <p className={`font-bold ${isUrgent ? "text-destructive" : "text-yellow-500"}`}>
            {daysLeft <= 0 ? "¡Tu membresía ha expirado!" : `Tu membresía vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {daysLeft <= 0
              ? "Para seguir disfrutando de los beneficios, contacta con nosotros para renovar."
              : `Tu membresía ${membershipName} finaliza el ${endDate}. Para mantener tus beneficios, contacta para renovar.`}
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
            <Button size="sm" className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
              <MessageCircle className="mr-1 h-3 w-3" /> Renovar por WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
