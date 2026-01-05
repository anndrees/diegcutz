import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, Users, User, Loader2, Bell } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  username: string;
}

export const AdminBroadcastNotification = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<"all" | "user">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users with push subscriptions
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      
      // Get users who have push subscriptions
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("user_id");

      if (subscriptions && subscriptions.length > 0) {
        const userIds = [...new Set(subscriptions.map(s => s.user_id))];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds)
          .order("full_name");

        if (profiles) {
          setUsers(profiles);
        }
      }
      
      setLoadingUsers(false);
    };

    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa el título y el mensaje",
        variant: "destructive",
      });
      return;
    }

    if (targetType === "user" && !selectedUserId) {
      toast({
        title: "Error",
        description: "Selecciona un usuario",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      if (targetType === "all") {
        // Send to all users
        const { data, error } = await supabase.functions.invoke("send-push-notification-all", {
          body: {
            notification: {
              title: title.trim(),
              body: body.trim(),
              data: { type: "admin_broadcast" },
            },
            notificationType: "admin_broadcast",
            metadata: { sent_by: "admin" },
          },
        });

        if (error) throw error;

        toast({
          title: "Notificación enviada",
          description: `Se envió a ${data?.sent || 0} dispositivos (${data?.usersNotified || 0} usuarios)`,
        });
      } else {
        // Send to specific user
        const selectedUser = users.find(u => u.id === selectedUserId);
        
        const { data, error } = await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: selectedUserId,
            notification: {
              title: title.trim(),
              body: body.trim(),
              data: { type: "admin_message" },
            },
            notificationType: "admin_message",
            userName: selectedUser?.full_name,
          },
        });

        if (error) throw error;

        toast({
          title: "Notificación enviada",
          description: `Se envió a ${data?.sent || 0} dispositivo(s) de ${selectedUser?.full_name || "usuario"}`,
        });
      }

      // Clear form
      setTitle("");
      setBody("");
      setSelectedUserId("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Notificación Push
        </CardTitle>
        <CardDescription>
          Envía notificaciones personalizadas a usuarios específicos o a todos los suscriptores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Destinatario</Label>
          <Select value={targetType} onValueChange={(v: "all" | "user") => setTargetType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Todos los usuarios suscritos
                </div>
              </SelectItem>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuario específico
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetType === "user" && (
          <div className="space-y-2">
            <Label>Seleccionar usuario</Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando usuarios...
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay usuarios con notificaciones activadas
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.full_name} (@{user.username})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la notificación"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50 caracteres</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Mensaje</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Contenido del mensaje"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{body.length}/200 caracteres</p>
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim() || (targetType === "user" && !selectedUserId)}
          className="w-full"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          {sending ? "Enviando..." : targetType === "all" ? "Enviar a todos" : "Enviar a usuario"}
        </Button>
      </CardContent>
    </Card>
  );
};