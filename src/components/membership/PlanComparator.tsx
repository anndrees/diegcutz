import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Membership {
  id: string;
  name: string;
  emoji: string;
  price: number;
  free_services_per_month: number;
  includes_beard_count: number;
  product_discount_percent: number;
  free_products_per_period: number;
  free_product_period_months: number;
  image_consulting: boolean;
  is_coming_soon: boolean;
  benefits: string[];
}

interface Props {
  activeMembershipId?: string | null;
}

export const PlanComparator = ({ activeMembershipId }: Props) => {
  const [plans, setPlans] = useState<Membership[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data } = await supabase.from("memberships").select("*").eq("is_active", true).order("sort_order");
    if (data) setPlans(data.map((m: any) => ({ ...m, benefits: Array.isArray(m.benefits) ? m.benefits : [] })));
  };

  if (plans.length === 0) return null;

  const features = [
    { label: "Precio", render: (p: Membership) => `${p.price}€/mes` },
    { label: "Servicios gratis/mes", render: (p: Membership) => String(p.free_services_per_month) },
    { label: "Barbas incluidas", render: (p: Membership) => p.includes_beard_count === -1 ? "Ilimitadas" : p.includes_beard_count === 0 ? "—" : String(p.includes_beard_count) },
    { label: "Descuento productos", render: (p: Membership) => p.product_discount_percent > 0 ? `${p.product_discount_percent}%` : "—" },
    { label: "Productos gratis", render: (p: Membership) => p.free_products_per_period > 0 ? `${p.free_products_per_period} cada ${p.free_product_period_months} meses` : "—" },
    { label: "Asesoría de imagen", render: (p: Membership) => p.image_consulting },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-muted-foreground font-normal">Característica</th>
            {plans.map(p => (
              <th key={p.id} className="text-center py-3 px-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[#D4AF37] font-bold">{p.emoji} {p.name}</span>
                  {activeMembershipId === p.id && <Badge className="bg-[#D4AF37] text-[8px] py-0">Tu plan</Badge>}
                  {p.is_coming_soon && <Badge variant="secondary" className="text-[8px] py-0">Pronto</Badge>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feat, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2.5 px-3 text-muted-foreground">{feat.label}</td>
              {plans.map(p => (
                <td key={p.id} className="py-2.5 px-3 text-center font-medium">
                  {typeof feat.render(p) === "boolean" ? (
                    feat.render(p) ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className={p.is_coming_soon ? "opacity-50" : ""}>{feat.render(p) as string}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
