import webpush from "web-push";

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:stephenprince427@gmail.com";

if (!vapidPublicKey || !vapidPrivateKey) {
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    symbol?: string;
    alertId?: string;
    [key: string]: unknown;
  };
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}


export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return {
        success: false,
        error: "VAPID keys not configured",
      };
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/favicon.ico",
        badge: payload.badge || "/favicon.ico",
        data: payload.data || {},
      })
    );

    return { success: true };
  } catch (error) {

 
    if (error instanceof Error) {
      if (
        error.message.includes("410") ||
        error.message.includes("Gone") ||
        error.message.includes("expired")
      ) {
        return {
          success: false,
          error: "Subscription expired",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Unknown error occurred",
    };
  }
}


export async function sendPushNotifications(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{
  successful: number;
  failed: number;
  errors: Array<{ endpoint: string; error: string }>;
}> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  let successful = 0;
  let failed = 0;
  const errors: Array<{ endpoint: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      successful++;
    } else {
      failed++;
      const error =
        result.status === "fulfilled"
          ? result.value.error || "Unknown error"
          : result.reason?.message || "Unknown error";
      errors.push({
        endpoint: subscriptions[index].endpoint,
        error,
      });
    }
  });

  return {
    successful,
    failed,
    errors,
  };
}

