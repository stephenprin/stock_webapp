import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getPushSubscriptionsByUserId } from "@/lib/actions/push.actions";
import { sendPushNotifications } from "@/lib/services/push-notification.service";
import { sendPriceAlertEmail } from "@/lib/nodemailer";

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
    const { testEmail, testPush } = body;

    const results: {
      email?: { success: boolean; error?: string; message?: string; details?: string };
      push?: { success: boolean; sent: number; errors: Array<{ endpoint: string; error: string }>; message?: string };
    } = {};

    if (testEmail !== false && session.user.email) {
      try {
        console.log(`[Test] Sending test email to ${session.user.email}`);
        console.log(`[Test] Nodemailer email configured:`, !!process.env.NODEMAILER_EMAIL);
        console.log(`[Test] Nodemailer password configured:`, !!process.env.NODEMAILER_PASSWORD);
        
        const emailResult = await sendPriceAlertEmail({
          email: session.user.email,
          name: session.user.name || "User",
          symbol: "TEST",
          company: "Test Company",
          currentPrice: 100.00,
          targetPrice: 95.00,
          alertType: "lower",
        });
        
        console.log(`[Test] Email sent successfully to ${session.user.email}`);
        console.log(`[Test] Email result:`, emailResult);
        results.email = { success: true, message: `Email sent to ${session.user.email}. Check your inbox and spam folder.` };
      } catch (error) {
        console.error(`[Test] Error sending email:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(`[Test] Full error details:`, {
          message: errorMessage,
          stack: errorStack,
          error: String(error),
        });
        results.email = {
          success: false,
          error: errorMessage,
          details: errorStack,
        };
      }
    }

    if (testPush !== false) {
      try {
        console.log(`[Test] Fetching push subscriptions for user ${session.user.id}`);
        const subscriptions = await getPushSubscriptionsByUserId(session.user.id);

        if (subscriptions.length === 0) {
          console.log(`[Test] No push subscriptions found for user ${session.user.id}`);
          results.push = {
            success: false,
            sent: 0,
            errors: [{ endpoint: "none", error: "No push subscriptions found. Please enable push notifications first." }],
          };
        } else {
          console.log(`[Test] Found ${subscriptions.length} subscription(s), sending push...`);
          console.log(`[Test] VAPID public key configured:`, !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
          console.log(`[Test] VAPID private key configured:`, !!process.env.VAPID_PRIVATE_KEY);
          
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

          console.log(`[Test] Push notification result:`, {
            successful: pushResult.successful,
            failed: pushResult.failed,
            errors: pushResult.errors,
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

    const allSuccess = 
      (results.email?.success !== false) && 
      (results.push?.success !== false || results.push?.sent === 0);

    const responseMessage = [];
    if (results.email) {
      responseMessage.push(`Email: ${results.email.success ? '✅ Sent' : '❌ Failed - ' + results.email.error}`);
    }
    if (results.push) {
      responseMessage.push(`Push: ${results.push.success ? `✅ Sent to ${results.push.sent} device(s)` : '❌ Failed - ' + results.push.errors.map(e => e.error).join(', ')}`);
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

