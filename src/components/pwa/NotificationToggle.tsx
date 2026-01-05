import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationToggleProps {
  variant?: "switch" | "button";
  showLabel?: boolean;
  className?: string;
}

export const NotificationToggle = ({ 
  variant = "switch", 
  showLabel = true,
  className = ""
}: NotificationToggleProps) => {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return null;
  }

  if (variant === "button") {
    return (
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <BellOff className="mr-2 h-4 w-4" />
            Desactivar notificaciones
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            Activar notificaciones
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="notifications" className="text-sm">
            Notificaciones push
          </Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === "denied"}
          />
        )}
      </div>
    </div>
  );
};
