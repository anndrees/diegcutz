import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, DollarSign, Users } from "lucide-react";
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { es } from "date-fns/locale";

type Booking = {
  id: string;
  booking_date: string;
  services: string[];
  total_price: number;
  user_id?: string | null;
  client_contact?: string;
};

interface StatisticsSectionProps {
  bookings: Booking[];
}

const COLORS = ['hsl(var(--neon-purple))', 'hsl(var(--neon-cyan))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const StatisticsSection = ({ bookings }: StatisticsSectionProps) => {
  // Calculate total revenue
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);

  // Calculate average booking value
  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  // Count services popularity
  const serviceCount: Record<string, number> = {};
  bookings.forEach(booking => {
    booking.services?.forEach(service => {
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });
  });

  const serviceData = Object.entries(serviceCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Revenue by month
  // To ensure we show months with 0 revenue, we create a range
  const revenueByMonth: Record<string, number> = {};
  
  // Find date range in current bookings or default to last 6 months
  let startDate = new Date();
  let endDate = new Date();
  
  if (bookings.length > 0) {
    const dates = bookings.map(b => new Date(b.booking_date));
    startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  } else {
    startDate = subMonths(new Date(), 5);
  }

  // Ensure at least 6 months interval for the chart if range is small
  const monthInterval = eachMonthOfInterval({
    start: startOfMonth(startDate),
    end: startOfMonth(endDate)
  });

  bookings.forEach(booking => {
    const date = parseISO(booking.booking_date);
    const monthKey = format(date, "yyyy-MM");
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (booking.total_price || 0);
  });

  const monthlyData = monthInterval.map(monthDate => {
    const monthKey = format(monthDate, "yyyy-MM");
    return {
      month: format(monthDate, "MMM yy", { locale: es }),
      revenue: revenueByMonth[monthKey] || 0,
      fullDate: monthDate
    };
  }).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-neon-purple/20 to-transparent border-neon-purple/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reservas</p>
                <p className="text-3xl font-bold text-neon-purple">{bookings.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-neon-cyan/20 to-transparent border-neon-cyan/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-3xl font-bold text-neon-cyan">{totalRevenue.toFixed(2)}€</p>
              </div>
              <DollarSign className="h-10 w-10 text-neon-cyan" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Promedio</p>
                <p className="text-3xl font-bold">{avgBookingValue.toFixed(2)}€</p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-3/20 to-transparent border-chart-3/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                <p className="text-3xl font-bold">
                  {new Set(bookings.map(b => b.user_id || b.client_contact || b.id)).size}
                </p>
              </div>
              <Users className="h-10 w-10 text-chart-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Popularity */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Populares</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de servicios
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Periodo</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}€`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--neon-purple))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de ingresos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Count Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cantidad de Servicios Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--neon-cyan))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de servicios
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
