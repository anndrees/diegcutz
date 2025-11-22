import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, DollarSign, Users } from "lucide-react";

type Booking = {
  id: string;
  booking_date: string;
  services: string[];
  total_price: number;
};

interface StatisticsSectionProps {
  bookings: Booking[];
}

const COLORS = ['hsl(var(--neon-purple))', 'hsl(var(--neon-cyan))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const StatisticsSection = ({ bookings }: StatisticsSectionProps) => {
  // Calculate total revenue
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);

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

  // Revenue by month (last 6 months)
  const revenueByMonth: Record<string, number> = {};
  bookings.forEach(booking => {
    const date = new Date(booking.booking_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + booking.total_price;
  });

  const monthlyData = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({
      month: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      revenue
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

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
                <p className="text-3xl font-bold">{new Set(bookings.map(b => b.id)).size}</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}€`} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--neon-purple))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Services Count Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cantidad de Servicios Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--neon-cyan))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
