import { supabase } from "@/integrations/supabase/client";

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send a push notification to a specific user
 */
export const sendPushNotification = async (
  userId: string,
  notification: NotificationPayload
): Promise<{ success: boolean; sent?: number; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        userId,
        notification
      }
    });

    if (error) {
      console.error("Error sending push notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, sent: data.sent };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Send a booking reminder notification
 */
export const sendBookingReminder = async (
  userId: string,
  bookingDate: string,
  bookingTime: string
): Promise<{ success: boolean }> => {
  const formattedDate = new Date(bookingDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return sendPushNotification(userId, {
    title: "⏰ Recordatorio de cita",
    body: `Tu cita es ${formattedDate} a las ${bookingTime.slice(0, 5)}. ¡Te esperamos!`,
    tag: "booking-reminder",
    data: {
      type: "booking-reminder",
      url: "/user"
    },
    actions: [
      { action: "view", title: "Ver detalles" }
    ]
  });
};

/**
 * Send a new booking confirmation notification
 */
export const sendBookingConfirmation = async (
  userId: string,
  bookingDate: string,
  bookingTime: string,
  services: string[]
): Promise<{ success: boolean }> => {
  const formattedDate = new Date(bookingDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return sendPushNotification(userId, {
    title: "✅ Reserva confirmada",
    body: `Tu cita para ${services.join(", ")} es el ${formattedDate} a las ${bookingTime.slice(0, 5)}`,
    tag: "booking-confirmation",
    data: {
      type: "booking-confirmation",
      url: "/user"
    }
  });
};

/**
 * Send a new chat message notification
 */
export const sendChatMessageNotification = async (
  userId: string,
  message: string
): Promise<{ success: boolean }> => {
  const truncatedMessage = message.length > 100 
    ? message.substring(0, 100) + "..." 
    : message;

  return sendPushNotification(userId, {
    title: "💬 Nuevo mensaje",
    body: truncatedMessage,
    tag: "chat-message",
    data: {
      type: "chat-message",
      url: "/"
    },
    actions: [
      { action: "view", title: "Ver mensaje" }
    ]
  });
};

/**
 * Send a booking cancellation notification
 */
export const sendBookingCancellation = async (
  userId: string,
  bookingDate: string,
  bookingTime: string,
  cancelledByAdmin: boolean = false
): Promise<{ success: boolean }> => {
  const formattedDate = new Date(bookingDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return sendPushNotification(userId, {
    title: cancelledByAdmin ? "❌ Cita cancelada" : "📝 Cancelación confirmada",
    body: cancelledByAdmin 
      ? `Tu cita del ${formattedDate} a las ${bookingTime.slice(0, 5)} ha sido cancelada. Contacta con nosotros para más info.`
      : `Has cancelado tu cita del ${formattedDate} a las ${bookingTime.slice(0, 5)}`,
    tag: "booking-cancellation",
    data: {
      type: "booking-cancellation",
      url: "/booking"
    }
  });
};

/**
 * Send a giveaway winner notification
 */
export const sendGiveawayWinnerNotification = async (
  userId: string,
  giveawayTitle: string,
  prize: string
): Promise<{ success: boolean }> => {
  return sendPushNotification(userId, {
    title: "🎉 ¡FELICIDADES!",
    body: `¡Has ganado el sorteo "${giveawayTitle}"! Tu premio: ${prize}`,
    tag: "giveaway-winner",
    data: {
      type: "giveaway-winner",
      url: "/giveaways"
    }
  });
};
