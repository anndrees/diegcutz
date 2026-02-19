import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "unsupported";
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const vapidKeyRef = useRef<string | null>(null);
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "unsupported"
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    return isSupported;
  }, []);

  // Get VAPID public key from server
  const getVapidKey = useCallback(async (): Promise<string | null> => {
    if (vapidKeyRef.current) return vapidKeyRef.current;

    try {
      const { data, error } = await supabase.functions.invoke("get-vapid-key");
      if (error) throw error;
      vapidKeyRef.current = data.publicKey;
      return data.publicKey;
    } catch (error) {
      console.error("Error fetching VAPID key:", error);
      return null;
    }
  }, []);

  // Get current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      const permission = Notification.permission;

      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        isLoading: false,
        permission
      });
    } catch (error) {
      console.error("Error checking push subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkSupport]);

  // Convert URL-safe base64 to Uint8Array for applicationServerKey
  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para activar las notificaciones",
        variant: "destructive"
      });
      return false;
    }

    if (!checkSupport()) {
      toast({
        title: "No compatible",
        description: "Tu navegador no soporta notificaciones push",
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast({
          title: "Permiso denegado",
          description: "Necesitas permitir las notificaciones para activarlas",
          variant: "destructive"
        });
        setState(prev => ({ ...prev, isLoading: false, permission }));
        return false;
      }

      // Get VAPID key from server
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        throw new Error("Could not get VAPID key");
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // Save subscription to database via edge function
      const { error } = await supabase.functions.invoke("push-subscribe", {
        body: {
          subscription: subscription.toJSON(),
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "¡Notificaciones activadas!",
        description: "Recibirás avisos de tus citas y mensajes"
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        permission: "granted"
      }));

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast({
        title: "Error",
        description: "No se pudieron activar las notificaciones",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user, checkSupport, getVapidKey, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from database
        await supabase.functions.invoke("push-unsubscribe", {
          body: { userId: user.id }
        });
      }

      toast({
        title: "Notificaciones desactivadas",
        description: "Ya no recibirás avisos push"
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast({
        title: "Error",
        description: "No se pudieron desactivar las notificaciones",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user, toast]);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscription
  };
};
