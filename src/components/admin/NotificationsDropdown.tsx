import { useState, useEffect } from "react";
import { Bell, KeyRound, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PasswordResetRequest {
  id: string;
  user_id: string | null;
  username: string;
  contact_value: string;
  status: string;
  created_at: string;
  matched_profile_id?: string | null;
}

export const NotificationsDropdown = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
    
    const channel = supabase
      .channel("password-reset-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "password_reset_requests" },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    const { data } = await supabase
      .from("password_reset_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!data) {
      setRequests([]);
      return;
    }

    const enriched = await Promise.all(
      (data as PasswordResetRequest[]).map(async (req) => {
        if (req.user_id) {
          return { ...req, matched_profile_id: req.user_id };
        }
        // Try matching by username or contact_value
        const filters: string[] = [];
        if (req.username) filters.push(`username.eq.${req.username}`);
        if (req.contact_value) filters.push(`contact_value.eq.${req.contact_value}`);
        
        if (filters.length === 0) return { ...req, matched_profile_id: null };

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .or(filters.join(","))
          .limit(1);
        
        return {
          ...req,
          matched_profile_id: profiles && profiles.length > 0 ? profiles[0].id : null,
        };
      })
    );

    setRequests(enriched);
  };

  const handleDismiss = async (id: string) => {
    setLoading(true);
    await supabase
      .from("password_reset_requests")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", id);
    
    toast({ title: "Notificación descartada" });
    loadRequests();
    setLoading(false);
  };

  const handleGoToClient = (profileId: string) => {
    navigate(`/admin/client/${profileId}`);
  };

  const pendingCount = requests.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs"
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pendiente{pendingCount !== 1 && "s"}</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {requests.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones pendientes
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {requests.map((request) => (
              <div key={request.id} className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Solicitud de restablecimiento
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{request.username} • {request.contact_value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 ml-11">
                  {request.matched_profile_id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleGoToClient(request.matched_profile_id!)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver ficha
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleDismiss(request.id)}
                    disabled={loading}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Descartar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
