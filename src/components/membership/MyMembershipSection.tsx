import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Calendar, Scissors, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MemberCard } from "./MemberCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const MyMembershipSection = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const [loyaltyToken, setLoyaltyToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadMembership();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadMembership = async () => {
    if (!user) return;
    const [subRes, tokenRes] = await Promise.all([
      supabase.from("user_memberships").select("*, membership:memberships(*)").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      supabase.from("profiles").select("loyalty_token").eq("id", user.id).single(),
    ]);

    console.log("MyMembership subRes:", subRes.data, subRes.error);
    if (subRes.data) {
      const sub = subRes.data as any;
      setMembership(sub);
      setPlan(Array.isArray(sub.membership) ? sub.membership[0] : sub.membership);
    }
    setLoyaltyToken((tokenRes.data as any)?.loyalty_token || null);
    setLoading(false);
  };

  if (loading || authLoading) return null;

  if (!membership || !plan) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 text-center">
          <Crown className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-3">No tienes una membresía activa</p>
          <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37]" onClick={() => navigate("/membership")}>
            Ver planes disponibles
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = Math.ceil((new Date(membership.end_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysTotal = 30;
  const daysUsed = daysTotal - Math.max(0, daysLeft);
  const servicesUsed = plan.free_services_per_month - membership.free_services_remaining;
  const beardsUsed = plan.includes_beard_count === -1 ? 0 : (plan.includes_beard_count - membership.beard_services_remaining);

  return (
    <>
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/10 p-1" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Crown className="h-5 w-5" />
              Mi Membresía
            </div>
            <Badge className="bg-[#D4AF37] text-background">{plan.emoji} {plan.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time remaining */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Tiempo restante</span>
              <span className={daysLeft <= 5 ? "text-destructive font-bold" : "text-foreground"}>{daysLeft} días</span>
            </div>
            <Progress value={(daysUsed / daysTotal) * 100} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">
              Renovación: {new Date(membership.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
            </p>
          </div>

          {/* Benefits usage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Scissors className="h-4 w-4 mx-auto mb-1 text-[#D4AF37]" />
              <p className="text-lg font-bold">{membership.free_services_remaining}<span className="text-xs font-normal text-muted-foreground">/{plan.free_services_per_month}</span></p>
              <p className="text-[10px] text-muted-foreground">Servicios restantes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Sparkles className="h-4 w-4 mx-auto mb-1 text-[#D4AF37]" />
              <p className="text-lg font-bold">
                {membership.beard_services_remaining >= 999 ? "∞" : membership.beard_services_remaining}
                {plan.includes_beard_count !== -1 && <span className="text-xs font-normal text-muted-foreground">/{plan.includes_beard_count}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">Barbas restantes</p>
            </div>
          </div>

          {plan.product_discount_percent > 0 && (
            <div className="bg-[#D4AF37]/10 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-[#D4AF37]">-{plan.product_discount_percent}% en productos</p>
              <p className="text-[10px] text-muted-foreground">Se aplica automáticamente</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="border-[#D4AF37]/30 text-[#D4AF37]" onClick={() => setShowCard(true)}>
              <Crown className="h-3 w-3 mr-1" /> Mi Tarjeta
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/membership")}>
              Ver planes <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {membership.is_paused && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center text-sm text-yellow-500">
              ⏸️ Tu membresía está pausada temporalmente
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Card Dialog */}
      <Dialog open={showCard} onOpenChange={setShowCard}>
        <DialogContent className="max-w-sm bg-transparent border-none shadow-none">
          <MemberCard
            userName={profile?.full_name || ""}
            planName={plan.name}
            planEmoji={plan.emoji}
            endDate={membership.end_date}
            memberSince={membership.start_date}
            loyaltyToken={loyaltyToken}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
