import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Crown, Check, AlertTriangle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Membership {
  id: string;
  name: string;
  emoji: string;
  price: number;
  benefits: string[];
  is_coming_soon: boolean;
}

const Membership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Membership | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data } = await supabase.from("memberships").select("*").eq("is_active", true).order("sort_order");
    if (data) {
      setMemberships(data.map((m: any) => ({ ...m, benefits: Array.isArray(m.benefits) ? m.benefits : [] })));
    }

    if (user) {
      const { data: sub } = await supabase.from("user_memberships").select("membership_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (sub) setActiveMembershipId(sub.membership_id);
    }
    setLoading(false);
  };

  const handleSelect = (plan: Membership) => {
    if (plan.is_coming_soon) return;
    setSelectedPlan(plan);
    setShowDisclaimer(true);
  };

  const whatsappUrl = (plan: Membership) => {
    const msg = encodeURIComponent(`¡Hola! Me interesa la membresía "${plan.name}" (${plan.price}€/mes). ¿Cómo puedo adquirirla?`);
    return `https://wa.me/34641637576?text=${msg}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen py-8 px-4 pt-safe">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <div className="text-center mb-12">
          <Crown className="h-12 w-12 mx-auto text-[#D4AF37] mb-4" />
          <h1 className="text-4xl md:text-6xl font-black text-[#D4AF37] mb-4">
            MEMBRESÍAS
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu estilo. Más cortes, más beneficios, más flow.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {memberships.map((plan, i) => {
            const isActive = activeMembershipId === plan.id;
            const isPremium = i >= 2;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  plan.is_coming_soon ? "opacity-60" : ""
                } ${isPremium ? "border-2 border-[#D4AF37]" : "border border-border"}`}
              >
                {isPremium && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-center py-1">
                    <span className="text-xs font-bold text-background uppercase tracking-wider">
                      {i === 3 ? "Próximamente" : "Popular"}
                    </span>
                  </div>
                )}

                <div className={`p-6 ${isPremium ? "pt-10" : ""} bg-card h-full flex flex-col`}>
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-[#D4AF37]">{plan.emoji} {plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-black text-foreground">{plan.price}€</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Incluye:</p>
                    <ul className="space-y-2">
                      {plan.benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
                          <span className="text-foreground">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    {isActive ? (
                      <Badge className="w-full justify-center py-2 bg-[#D4AF37] text-background">Tu plan actual</Badge>
                    ) : plan.is_coming_soon ? (
                      <Button disabled className="w-full opacity-50">Próximamente</Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] text-background font-bold"
                        onClick={() => handleSelect(plan)}
                      >
                        Quiero esta membresía
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-card rounded-2xl p-8 border border-border mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">ℹ️ Información importante</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Las membresías tienen una duración de 30 días desde su activación.</p>
            <p>• Los beneficios no utilizados durante el periodo no son acumulables ni transferibles.</p>
            <p>• Los descuentos en productos se aplican automáticamente en la reserva.</p>
            <p>• Los servicios gratuitos incluidos no pueden canjearse por dinero.</p>
            <p>• Para gestionar tu membresía, contacta directamente con el administrador.</p>
          </div>
          <div className="mt-4">
            <Button variant="link" onClick={() => navigate("/membership-policy")} className="text-[#D4AF37] p-0">
              Ver política completa de membresías →
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Antes de continuar
            </DialogTitle>
            <DialogDescription>
              Lee atentamente las condiciones de la membresía <strong>{selectedPlan?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="font-bold text-yellow-500 mb-2">Condiciones generales:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Los beneficios NO son acumulables entre periodos.</li>
                <li>• Los servicios/cortes no utilizados NO podrán ser canjeados por dinero ni por otra cosa.</li>
                <li>• La membresía es personal e intransferible.</li>
                <li>• El pago se gestiona en persona con el administrador.</li>
                <li>• La duración de cada periodo es de 30 días exactos.</li>
                <li>• Los descuentos en productos se aplican automáticamente.</li>
                <li>• DiegCutz se reserva el derecho de modificar los beneficios con previo aviso.</li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              Para adquirir esta membresía, deberás contactar con un administrador por WhatsApp. El pago se realizará en persona.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDisclaimer(false)}>Cancelar</Button>
            {selectedPlan && (
              <a href={whatsappUrl(selectedPlan)} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactar por WhatsApp
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Membership;
