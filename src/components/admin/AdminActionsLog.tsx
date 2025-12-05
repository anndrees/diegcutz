import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ActionLog = {
  id: string;
  action_type: string;
  description: string;
  target_user_id: string | null;
  target_user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BAN_USER: { label: "Baneo", variant: "destructive" },
  UNBAN_USER: { label: "Desbaneo", variant: "secondary" },
  RESTRICT_USER: { label: "Restricción", variant: "destructive" },
  UNRESTRICT_USER: { label: "Quitar restricción", variant: "secondary" },
  DELETE_USER: { label: "Eliminar usuario", variant: "destructive" },
  UPDATE_LOYALTY: { label: "Fidelización", variant: "default" },
  UPDATE_PROFILE: { label: "Editar perfil", variant: "outline" },
  DELETE_RATING: { label: "Eliminar valoración", variant: "destructive" },
  CREATE_GIVEAWAY: { label: "Crear sorteo", variant: "default" },
  UPDATE_GIVEAWAY: { label: "Editar sorteo", variant: "outline" },
  DELETE_GIVEAWAY: { label: "Eliminar sorteo", variant: "destructive" },
  FINISH_GIVEAWAY: { label: "Finalizar sorteo", variant: "secondary" },
  SELECT_GIVEAWAY_WINNER: { label: "Seleccionar ganador", variant: "default" },
  DELETE_BOOKING: { label: "Eliminar reserva", variant: "destructive" },
  UPDATE_BOOKING: { label: "Editar reserva", variant: "outline" },
};

export const AdminActionsLog = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_action_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive",
      });
      return;
    }

    setLogs((data || []) as ActionLog[]);
  };

  const handleClearLogs = async () => {
    if (!confirm("¿Seguro que quieres borrar todo el historial de acciones?")) return;

    const { error } = await supabase.from("admin_action_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast({ title: "Error", description: "No se pudo borrar el historial", variant: "destructive" });
      return;
    }

    toast({ title: "Historial borrado" });
    loadLogs();
  };

  const getActionInfo = (actionType: string) => {
    return ACTION_LABELS[actionType] || { label: actionType, variant: "outline" as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historial de Acciones</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas {logs.length} acciones de administración
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadLogs} disabled={loading} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleClearLogs} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Borrar historial
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay acciones registradas
          </p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuario afectado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const actionInfo = getActionInfo(log.action_type);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <div>
                          <p>{format(new Date(log.created_at), "d MMM yyyy", { locale: es })}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo.variant}>
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{log.description}</p>
                      </TableCell>
                      <TableCell>
                        {log.target_user_name || (
                          <span className="text-muted-foreground">-</span>
                        )}
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
