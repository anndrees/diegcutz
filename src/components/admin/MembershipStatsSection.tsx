import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Users, TrendingUp, AlertTriangle, Download, DollarSign, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface MemberStats {
  totalActive: number;
  totalExpired: number;
  totalCancelled: number;
  totalPaused: number;
  estimatedRevenue: number;
  planDistribution: { name: string; count: number; color: string }[];
  benefitUsage: { userId: string; userName: string; membershipName: string; servicesUsed: number; servicesTotal: number; beardsUsed: number; beardsTotal: number; daysLeft: number; paymentStatus: string }[];
  overduePayments: { userId: string; userName: string; membershipName: string; endDate: string }[];
  unusedBenefits: { userId: string; userName: string; membershipName: string; servicesRemaining: number; servicesTotal: number; daysLeft: number }[];
}

const PLAN_COLORS = [
  "hsl(280, 80%, 60%)", // purple
  "hsl(190, 95%, 50%)", // cyan
  "hsl(45, 93%, 47%)",  // gold
  "hsl(0, 85%, 60%)",   // red
  "hsl(120, 60%, 50%)", // green
];

export const MembershipStatsSection = () => {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [membershipsRes, userMembershipsRes, profilesRes] = await Promise.all([
      supabase.from("memberships").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("user_memberships").select("*"),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const memberships = membershipsRes.data || [];
    const userMemberships = userMembershipsRes.data || [];
    const profiles = profilesRes.data || [];
    const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
    const membershipMap = new Map(memberships.map((m: any) => [m.id, m]));

    const active = userMemberships.filter(um => um.status === "active" && !um.is_paused);
    const paused = userMemberships.filter(um => um.is_paused);
    const expired = userMemberships.filter(um => um.status === "expired");
    const cancelled = userMemberships.filter(um => um.status === "cancelled");

    // Plan distribution
    const planCounts: Record<string, number> = {};
    active.forEach(um => {
      const m = membershipMap.get(um.membership_id);
      if (m) planCounts[m.name] = (planCounts[m.name] || 0) + 1;
    });
    const planDistribution = Object.entries(planCounts).map(([name, count], i) => ({
      name, count, color: PLAN_COLORS[i % PLAN_COLORS.length]
    }));

    // Estimated monthly revenue
    const estimatedRevenue = active.reduce((sum, um) => {
      const m = membershipMap.get(um.membership_id);
      return sum + (m?.price || 0);
    }, 0);

    // Benefit usage
    const benefitUsage = active.map(um => {
      const m = membershipMap.get(um.membership_id);
      const daysLeft = Math.ceil((new Date(um.end_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        userId: um.user_id,
        userName: profileMap.get(um.user_id) || "Desconocido",
        membershipName: m?.name || "",
        servicesUsed: (m?.free_services_per_month || 0) - um.free_services_remaining,
        servicesTotal: m?.free_services_per_month || 0,
        beardsUsed: Math.max(0, (m?.includes_beard_count === -1 ? 0 : (m?.includes_beard_count || 0)) - um.beard_services_remaining),
        beardsTotal: m?.includes_beard_count === -1 ? -1 : (m?.includes_beard_count || 0),
        daysLeft,
        paymentStatus: um.payment_status || "paid",
      };
    });

    // Overdue payments (expired but payment_status not paid, or active past end_date)
    const today = new Date().toISOString().split("T")[0];
    const overduePayments = userMemberships
      .filter(um => um.status === "active" && um.end_date < today)
      .map(um => ({
        userId: um.user_id,
        userName: profileMap.get(um.user_id) || "Desconocido",
        membershipName: membershipMap.get(um.membership_id)?.name || "",
        endDate: um.end_date,
      }));

    // Unused benefits alerts (>50% unused with <7 days left)
    const unusedBenefits = benefitUsage.filter(b => {
      if (b.servicesTotal === 0) return false;
      const usagePercent = b.servicesUsed / b.servicesTotal;
      return usagePercent < 0.5 && b.daysLeft <= 7 && b.daysLeft > 0;
    });

    setStats({
      totalActive: active.length,
      totalExpired: expired.length,
      totalCancelled: cancelled.length,
      totalPaused: paused.length,
      estimatedRevenue,
      planDistribution,
      benefitUsage,
      overduePayments,
      unusedBenefits,
    });
    setLoading(false);
  };

  const exportCSV = () => {
    if (!stats) return;
    const headers = ["Nombre", "Plan", "Servicios Usados", "Servicios Total", "Días Restantes", "Estado Pago"];
    const rows = stats.benefitUsage.map(b => [
      b.userName, b.membershipName, b.servicesUsed, b.servicesTotal, b.daysLeft, b.paymentStatus
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `miembros_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Cargando estadísticas...</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-transparent border-[#D4AF37]/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Miembros Activos</p>
                <p className="text-3xl font-bold text-[#D4AF37]">{stats.totalActive}</p>
              </div>
              <Crown className="h-8 w-8 text-[#D4AF37]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-neon-cyan/20 to-transparent border-neon-cyan/30">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Est./Mes</p>
              <p className="text-3xl font-bold text-neon-cyan">{stats.estimatedRevenue.toFixed(0)}€</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/30">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Pausadas</p>
              <p className="text-3xl font-bold">{stats.totalPaused}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/30">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Expiradas</p>
              <p className="text-3xl font-bold text-yellow-500">{stats.totalExpired}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/20 to-transparent border-destructive/30">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-3xl font-bold text-destructive">{stats.totalCancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.planDistribution.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay miembros activos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    dataKey="count"
                  >
                    {stats.planDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Benefit Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uso de Beneficios por Miembro</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.benefitUsage.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.benefitUsage.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => [value, name === "servicesUsed" ? "Usados" : "Total"]} />
                  <Bar dataKey="servicesUsed" fill="hsl(190, 95%, 50%)" name="Usados" />
                  <Bar dataKey="servicesTotal" fill="hsl(190, 95%, 50%, 0.3)" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.overduePayments.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Avisos de Impago ({stats.overduePayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.overduePayments.map((op, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-semibold">{op.userName}</p>
                    <p className="text-sm text-muted-foreground">{op.membershipName} · Venció: {op.endDate}</p>
                  </div>
                  <Badge variant="destructive">Pendiente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.unusedBenefits.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" /> Beneficios sin Usar ({stats.unusedBenefits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.unusedBenefits.map((ub, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                  <div>
                    <p className="font-semibold">{ub.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {ub.membershipName} · {ub.servicesRemaining}/{ub.servicesTotal} servicios sin usar · {ub.daysLeft} días restantes
                    </p>
                  </div>
                  <Badge className="bg-yellow-500">Contactar</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Member Table + Export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Listado de Miembros Activos</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {stats.benefitUsage.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay miembros activos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Plan</th>
                    <th className="text-center py-2 px-3">Servicios</th>
                    <th className="text-center py-2 px-3">Barbas</th>
                    <th className="text-center py-2 px-3">Días</th>
                    <th className="text-center py-2 px-3">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.benefitUsage.map((b, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{b.userName}</td>
                      <td className="py-2 px-3">{b.membershipName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={b.servicesUsed === b.servicesTotal ? "text-green-500" : ""}>{b.servicesUsed}/{b.servicesTotal}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {b.beardsTotal === -1 ? "∞" : `${b.beardsUsed}/${b.beardsTotal}`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={b.daysLeft <= 4 ? "text-destructive font-bold" : b.daysLeft <= 10 ? "text-yellow-500" : ""}>{b.daysLeft}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={b.paymentStatus === "paid" ? "default" : "destructive"} className="text-xs">
                          {b.paymentStatus === "paid" ? "✓" : "Pendiente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
