import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, RefreshCw, User, Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

type NotificationRecord = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  notification_type: string;
  title: string;
  body: string;
  status: string;
  sent_count: number;
  total_subscriptions: number;
  error_details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  booking_confirmation: { label: "Reserva confirmada", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-500" },
  booking_reminder: { label: "Recordatorio", icon: <Clock className="h-4 w-4" />, color: "text-blue-500" },
  booking_cancellation: { label: "Cancelación", icon: <XCircle className="h-4 w-4" />, color: "text-red-500" },
  chat_message: { label: "Mensaje chat", icon: <Bell className="h-4 w-4" />, color: "text-purple-500" },
  giveaway_winner: { label: "Ganador sorteo", icon: <Bell className="h-4 w-4" />, color: "text-yellow-500" },
  new_giveaway: { label: "Nuevo sorteo", icon: <Users className="h-4 w-4" />, color: "text-neon-cyan" },
  inactive_reminder: { label: "Usuario inactivo", icon: <User className="h-4 w-4" />, color: "text-orange-500" },
  broadcast: { label: "Broadcast", icon: <Users className="h-4 w-4" />, color: "text-muted-foreground" },
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  pending: "outline",
  failed: "destructive",
  no_subscribers: "secondary",
};

export const NotificationHistoryManagement = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setLoading(false);

    if (!error && data) {
      setNotifications(data as NotificationRecord[]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getTypeInfo = (type: string) => {
    return typeLabels[type] || { label: type, icon: <Bell className="h-4 w-4" />, color: "text-muted-foreground" };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent": return "Enviada";
      case "pending": return "Pendiente";
      case "failed": return "Fallida";
      case "no_subscribers": return "Sin suscriptores";
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Historial de Notificaciones Push
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay notificaciones en el historial</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Enviadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif) => {
                  const typeInfo = getTypeInfo(notif.notification_type);
                  return (
                    <TableRow key={notif.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(notif.created_at), "d MMM HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                          {typeInfo.icon}
                          <span className="text-sm">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {notif.user_id ? (
                          <Link 
                            to={`/admin/client/${notif.user_id}`}
                            className="text-neon-cyan hover:underline flex items-center gap-1"
                          >
                            <User className="h-3 w-3" />
                            {notif.user_name || "Usuario"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Todos los usuarios
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{notif.body}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[notif.status] || "secondary"}>
                          {getStatusLabel(notif.status)}
                        </Badge>
                        {notif.error_details && (
                          <div className="mt-1">
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Error
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{notif.sent_count}</span>
                        <span className="text-muted-foreground">/{notif.total_subscriptions}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
