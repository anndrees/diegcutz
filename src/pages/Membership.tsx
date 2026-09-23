import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Crown, Check, AlertTriangle, MessageCircle, GitCompareArrows, Info } from "lucide-react";
import { PlanComparator } from "@/components/membership/PlanComparator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomerPage } from "@/components/customer/CustomerPage";

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
    <CustomerPage><div className="membership-page min-h-screen">
      <div className="noir-page-head"><div><p className="customer-kicker">01 / PLANES</p><div><h1 className="noir-title">Una rutina con <em>criterio.</em></h1><p className="noir-lede">Elige una membresía pensada para mantener tu imagen siempre en su punto.</p></div></div></div>
      <div className="max-w-6xl mx-auto py-12 md:py-20 px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        {/* Plans Grid */}
        <div className="membership-plans grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-16">
          {memberships.map((plan, i) => {
            const isActive = activeMembershipId === plan.id;
            const isPremium = i >= 2;

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden transition-colors duration-300 hover:bg-accent ${
                  plan.is_coming_soon ? "opacity-60" : ""
                } bg-background`}
              >
                {isPremium && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-center py-1">
                    <span className="text-xs font-bold text-background uppercase tracking-wider">
                      {i === 3 ? "Próximamente" : "Popular"}
                    </span>
                  </div>
                )}

                <div className={`p-6 ${isPremium ? "pt-10" : ""} bg-card h-full flex flex-col`}>
                  <div className="mb-4">
                    <Crown className="h-5 w-5 text-primary mb-4" /><h3 className="text-xl font-semibold uppercase tracking-wide">{plan.name}</h3>
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
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    {isActive ? (
                      <Badge className="w-full justify-center py-2 bg-primary text-background">Tu plan actual</Badge>
                    ) : plan.is_coming_soon ? (
                      <Button disabled className="w-full opacity-50">Próximamente</Button>
                    ) : (
                      <Button
                        className="w-full"
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

        {/* Plan Comparator */}
        <div className="bg-card border border-border mb-8 overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center gap-3"><GitCompareArrows className="text-primary" /> Compara los planes</h2>
            <p className="text-sm text-muted-foreground">Encuentra el plan perfecto para ti</p>
          </div>
          <div className="px-4 pb-6">
            <PlanComparator activeMembershipId={activeMembershipId} />
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-card p-8 border border-border mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-3"><Info className="text-primary" /> Información importante</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Las membresías tienen una duración de 30 días desde su activación.</p>
            <p>• Los beneficios no utilizados durante el periodo no son acumulables ni transferibles.</p>
            <p>• Los descuentos en productos se aplican automáticamente en la reserva.</p>
            <p>• Los servicios gratuitos incluidos no pueden canjearse por dinero.</p>
            <p>• Para gestionar tu membresía, contacta directamente con el administrador.</p>
          </div>
          <div className="mt-4">
            <Button variant="link" onClick={() => navigate("/membership-policy")} className="text-primary p-0">
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
    </div></CustomerPage>
  );
};

export default Membership;
