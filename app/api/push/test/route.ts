import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getPushSubscriptionsByUserId } from "@/lib/actions/push.actions";
import { sendPushNotifications } from "@/lib/services/push-notification.service";

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
    const { title, body: messageBody, symbol } = body;

    const subscriptions = await getPushSubscriptionsByUserId(session.user.id);

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No push subscriptions found. Please enable push notifications first.",
        },
        { status: 400 }
      );
    }

    const result = await sendPushNotifications(
      subscriptions,
      {
        title: title || " Test Notification",
        body:
          messageBody ||
          "This is a test push notification to verify your setup is working correctly!",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          url: symbol ? `/search?symbol=${symbol}` : "/dashboard",
          symbol: symbol || undefined,
          type: "test",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${result.successful} subscription(s)`,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

