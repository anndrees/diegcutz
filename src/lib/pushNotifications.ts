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
  notification: NotificationPayload,
  notificationType?: string,
  userName?: string
): Promise<{ success: boolean; sent?: number; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        userId,
        notification,
        notificationType,
        userName
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
 * Send a push notification to ALL users (broadcast)
 */
export const sendPushNotificationToAll = async (
  notification: NotificationPayload,
  notificationType: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; sent?: number; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification-all", {
      body: {
        notification,
        notificationType,
        metadata
      }
    });

    if (error) {
      console.error("Error sending push notification to all:", error);
      return { success: false, error: error.message };
    }

    return { success: true, sent: data.sent };
  } catch (error) {
    console.error("Error sending push notification to all:", error);
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
  }, "booking_reminder");
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
  }, "booking_confirmation");
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
  }, "chat_message");
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
  }, "booking_cancellation");
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
  }, "giveaway_winner");
};

/**
 * Send new giveaway notification to all users
 */
export const sendNewGiveawayNotification = async (
  giveawayTitle: string,
  prize: string,
  endDate: string
): Promise<{ success: boolean }> => {
  const formattedEndDate = new Date(endDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long"
  });

  return sendPushNotificationToAll({
    title: "🎁 ¡Nuevo Sorteo!",
    body: `Participa en "${giveawayTitle}" y gana: ${prize}. Hasta el ${formattedEndDate}`,
    tag: "new-giveaway",
    data: {
      type: "new-giveaway",
      url: "/giveaways"
    }
  }, "new_giveaway", { giveawayTitle, prize });
};

/**
 * Send membership activation notification
 */
export const sendMembershipActivatedNotification = async (
  userId: string,
  membershipName: string,
  endDate: string
): Promise<{ success: boolean }> => {
  const formattedEndDate = new Date(endDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return sendPushNotification(userId, {
    title: "👑 ¡Membresía activada!",
    body: `Tu membresía ${membershipName} está activa hasta el ${formattedEndDate}. ¡Disfruta de tus beneficios!`,
    tag: "membership-activated",
    data: { type: "membership-activated", url: "/membership" }
  }, "membership_activated");
};

/**
 * Send membership renewal notification
 */
export const sendMembershipRenewedNotification = async (
  userId: string,
  membershipName: string,
  newEndDate: string
): Promise<{ success: boolean }> => {
  const formattedEndDate = new Date(newEndDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return sendPushNotification(userId, {
    title: "🔄 Membresía renovada",
    body: `Tu membresía ${membershipName} ha sido renovada hasta el ${formattedEndDate}. ¡Seguimos!`,
    tag: "membership-renewed",
    data: { type: "membership-renewed", url: "/membership" }
  }, "membership_renewed");
};

/**
 * Send membership cancellation notification
 */
export const sendMembershipCancelledNotification = async (
  userId: string,
  membershipName: string
): Promise<{ success: boolean }> => {
  return sendPushNotification(userId, {
    title: "😢 Membresía cancelada",
    body: `Tu membresía ${membershipName} ha sido cancelada. Contacta con nosotros si quieres reactivarla.`,
    tag: "membership-cancelled",
    data: { type: "membership-cancelled", url: "/membership" }
  }, "membership_cancelled");
};

/**
 * Send membership upgrade notification
 */
export const sendMembershipUpgradedNotification = async (
  userId: string,
  newMembershipName: string,
  endDate: string
): Promise<{ success: boolean }> => {
  const formattedEndDate = new Date(endDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return sendPushNotification(userId, {
    title: "⬆️ ¡Upgrade de membresía!",
    body: `Has sido actualizado a ${newMembershipName} hasta el ${formattedEndDate}. ¡Disfruta de más beneficios!`,
    tag: "membership-upgraded",
    data: { type: "membership-upgraded", url: "/membership" }
  }, "membership_upgraded");
};

/**
 * Send membership downgrade scheduled notification
 */
export const sendMembershipDowngradeScheduledNotification = async (
  userId: string,
  currentName: string,
  newName: string
): Promise<{ success: boolean }> => {
  return sendPushNotification(userId, {
    title: "📋 Cambio de membresía programado",
    body: `Al finalizar tu membresía ${currentName}, se activará automáticamente ${newName}.`,
    tag: "membership-downgrade",
    data: { type: "membership-downgrade", url: "/membership" }
  }, "membership_downgrade");
};
