"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscribeToPush, unsubscribeFromPush, getUserPushSubscriptions } from "@/lib/actions/push.actions";

export default function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);

      // Check notification permission
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }

      checkSubscriptionStatus();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const result = await getUserPushSubscriptions();
      if (result.success && result.subscriptions && result.subscriptions.length > 0) {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked. Please enable them in your browser settings."
      );
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);

    if (permission === "granted") {
      return true;
    } else {
      toast.error("Notification permission denied");
      return false;
    }
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      toast.error("Failed to register service worker");
      return null;
    }
  };

  const getVapidPublicKey = (): string => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
      throw new Error("VAPID public key is not configured");
    }
    return key;
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);

    try {
    
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        setIsLoading(false);
        return;
      }

      const serviceWorker = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const vapidKey = urlBase64ToUint8Array(getVapidPublicKey());
      const subscription = await serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as unknown as string,
      });

      const result = await subscribeToPush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      });

      if (result.success) {
        setIsSubscribed(true);
        toast.success("Push notifications enabled successfully!");
      } else {
        toast.error(result.error || "Failed to enable push notifications");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to enable push notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {

        await subscription.unsubscribe();
        const result = await unsubscribeFromPush(subscription.endpoint);

        if (result.success) {
          setIsSubscribed(false);
          toast.success("Push notifications disabled successfully");
        } else {
          toast.error(result.error || "Failed to disable push notifications");
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to disable push notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; 
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">Browser Push Notifications</h3>
          <p className="text-sm text-gray-400">
            Get instant browser popup alerts when your price alerts are triggered
          </p>
          {!isSubscribed && (
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ Push notifications are disabled. Click "Enable" to receive browser popup notifications.
            </p>
          )}
          {isSubscribed && permission === "granted" && (
            <p className="text-xs text-green-400 mt-2">
              ✅ Enabled - You'll see browser popup notifications when price alerts trigger
            </p>
          )}
          {permission === "denied" && (
            <p className="text-xs text-red-400 mt-2">
              ❌ Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
        <Button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading || permission === "denied"}
          variant={isSubscribed ? "outline" : "default"}
          className={
            isSubscribed
              ? "border-green-500 text-green-500 hover:bg-green-500/10"
              : "bg-green-500 hover:bg-green-600 text-gray-900"
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isSubscribed ? (
            <BellOff className="h-4 w-4 mr-2" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          {isLoading
            ? "Loading..."
            : isSubscribed
              ? "Disable"
              : "Enable"}
        </Button>
      </div>

      {/* Test Notification Button */}
      {isSubscribed && permission === "granted" && (
        <div className="space-y-3">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400">
              ✅ Push notifications are enabled. You should see browser popup notifications when price alerts trigger.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              If you don't see notifications, check your browser's notification settings and ensure Do Not Disturb mode is off.
            </p>
          </div>
        </div>
      )}
      
      {isSubscribed && (
        <div className="space-y-3">
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm mb-1">Full Test (Email + Push + SMS/WhatsApp)</h4>
                <p className="text-xs text-gray-400">
                  Test email, push notifications, and SMS/WhatsApp together
                </p>
              </div>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch("/api/push/test-full", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ testEmail: true, testPush: true, testSMS: true }),
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                      const emailStatus = result.results?.email?.success 
                        ? `✅ Email: Sent (check inbox & spam)`
                        : `❌ Email: ${result.results?.email?.error || "Failed"}`;
                      const pushStatus = result.results?.push?.success
                        ? `✅ Push: Sent to ${result.results.push.sent} device(s)`
                        : `❌ Push: ${result.results?.push?.errors?.[0]?.error || "Failed"}`;
                      
                      const smsStatus = result.results?.sms?.success
                        ? `✅ SMS/WhatsApp: Sent`
                        : result.results?.sms?.error 
                          ? `❌ SMS/WhatsApp: ${result.results.sms.error}`
                          : `⚠️ SMS/WhatsApp: Not configured`;
                      
                      toast.success("Test completed!", {
                        description: `${emailStatus} | ${pushStatus} | ${smsStatus}`,
                        duration: 10000,
                      });
                    } else {
                      const errors = [];
                      if (result.results?.email && !result.results.email.success) {
                        errors.push(`Email: ${result.results.email.error}`);
                      }
                      if (result.results?.push && !result.results.push.success) {
                        errors.push(`Push: ${result.results.push.errors?.[0]?.error || "Failed"}`);
                      }
                      if (result.results?.sms && !result.results.sms.success) {
                        errors.push(`SMS/WhatsApp: ${result.results.sms.error || "Failed"}`);
                      }
                      toast.error("Test completed with errors", {
                        description: errors.length > 0 ? errors.join(", ") : result.message || "Check console for details",
                        duration: 10000,
                      });
                    }
                  } catch (error) {
                    console.error("[Test] Error:", error);
                    toast.error("Failed to send test", {
                      description: error instanceof Error ? error.message : "Check console for details",
                      duration: 10000,
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Test All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to convert VAPID key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

