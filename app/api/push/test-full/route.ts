import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getPushSubscriptionsByUserId } from "@/lib/actions/push.actions";
import { sendPushNotifications } from "@/lib/services/push-notification.service";
import { sendPriceAlertEmail } from "@/lib/nodemailer";
import { sendPriceAlertSMS } from "@/lib/services/sms.service";
import { getUserPhoneNumber } from "@/lib/actions/user.actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testEmail, testPush, testSMS } = body;

    const results: {
      email?: { success: boolean; error?: string; message?: string; details?: string };
      push?: { success: boolean; sent: number; errors: Array<{ endpoint: string; error: string }>; message?: string };
      sms?: { success: boolean; error?: string; message?: string; messageId?: string };
    } = {};

    if (testEmail !== false && session.user.email) {
      try {
        await sendPriceAlertEmail({
          email: session.user.email,
          name: session.user.name || "User",
          symbol: "TEST",
          company: "Test Company",
          currentPrice: 100.00,
          targetPrice: 95.00,
          alertType: "lower",
        });
        
        results.email = { success: true, message: `Email sent to ${session.user.email}. Check your inbox and spam folder.` };
      } catch (error) {
        console.error(`[Test] Error sending email:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        results.email = {
          success: false,
          error: errorMessage,
          details: errorStack,
        };
      }
    }

    if (testPush !== false) {
      try {
        const subscriptions = await getPushSubscriptionsByUserId(session.user.id);

        if (subscriptions.length === 0) {
          results.push = {
            success: false,
            sent: 0,
            errors: [{ endpoint: "none", error: "No push subscriptions found. Please enable push notifications first." }],
          };
        } else {
          const pushResult = await sendPushNotifications(subscriptions, {
            title: "🧪 Test Notification",
            body: "This is a test push notification! If you see this, push notifications are working correctly.",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
              url: "/dashboard",
              symbol: "TEST",
              type: "test",
            },
          });

          results.push = {
            success: pushResult.successful > 0,
            sent: pushResult.successful,
            errors: pushResult.errors,
            message: pushResult.successful > 0 
              ? ` Push sent to ${pushResult.successful} device(s). Check for browser popup notification in top-right (Mac) or bottom-right (Windows) corner.`
              : `Failed to send push. Errors: ${pushResult.errors.map(e => e.error).join(', ')}`,
          };
        }
      } catch (error) {
        console.error(`[Test] Error sending push:`, error);
        results.push = {
          success: false,
          sent: 0,
          errors: [
            {
              endpoint: "unknown",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          ],
        };
      }
    }

    if (testSMS !== false) {
      try {
        const phoneResult = await getUserPhoneNumber();

        if (!phoneResult.success || !phoneResult.phoneNumber) {
          results.sms = {
            success: false,
            error: "No phone number found. Please add your phone number in settings first.",
            message: "Please configure your phone number in Settings → SMS Alerts to test SMS/WhatsApp notifications.",
          };
        } else if (phoneResult.smsNotificationsEnabled === false) {
          results.sms = {
            success: false,
            error: "SMS/WhatsApp notifications are disabled",
            message: "SMS/WhatsApp notifications are disabled in your settings. Enable them to receive test messages.",
          };
        } else {
          const smsResult = await sendPriceAlertSMS({
            phoneNumber: phoneResult.phoneNumber,
            symbol: "TEST",
            company: "Test Company",
            currentPrice: 100.00,
            targetPrice: 95.00,
            alertType: "lower",
          });

          if (smsResult.success) {
            const messageType = process.env.USE_WHATSAPP === "true" ? "WhatsApp" : "SMS";
            results.sms = {
              success: true,
              message: `${messageType} sent to ${phoneResult.phoneNumber}. Check your phone for the message.`,
              messageId: smsResult.messageId,
            };
          } else {
            console.error(`[Test] Failed to send SMS/WhatsApp:`, smsResult.error);
            results.sms = {
              success: false,
              error: smsResult.error || "Failed to send SMS/WhatsApp",
              message: smsResult.error || "Failed to send message. Check your Twilio configuration.",
            };
          }
        }
      } catch (error) {
        console.error(`[Test] Error sending SMS/WhatsApp:`, error);
        results.sms = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          message: error instanceof Error ? error.message : "Failed to send SMS/WhatsApp",
        };
      }
    }

    const allSuccess = 
      (results.email?.success !== false) && 
      (results.push?.success !== false || results.push?.sent === 0) &&
      (results.sms?.success !== false || results.sms?.error === "SMS/WhatsApp notifications are disabled");

    const responseMessage = [];
    if (results.email) {
      responseMessage.push(`Email: ${results.email.success ? '✅ Sent' : '❌ Failed - ' + results.email.error}`);
    }
    if (results.push) {
      responseMessage.push(`Push: ${results.push.success ? `✅ Sent to ${results.push.sent} device(s)` : '❌ Failed - ' + results.push.errors.map(e => e.error).join(', ')}`);
    }
    if (results.sms) {
      const messageType = process.env.USE_WHATSAPP === "true" ? "WhatsApp" : "SMS";
      responseMessage.push(`${messageType}: ${results.sms.success ? '✅ Sent' : '❌ Failed - ' + results.sms.error}`);
    }

    return NextResponse.json({
      success: allSuccess,
      results,
      message: responseMessage.join(' | '),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Test] Error in test-full route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

