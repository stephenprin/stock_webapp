import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/services/push-notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO:For additional security, you could add API key authentication here
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, payload } = body;

    if (!subscription || !payload) {
      return NextResponse.json(
        { success: false, error: "Subscription and payload are required" },
        { status: 400 }
      );
    }

    if (
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription format" },
        { status: 400 }
      );
    }

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { success: false, error: "Payload must include title and body" },
        { status: 400 }
      );
    }

    const result = await sendPushNotification(subscription, payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send notification" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in push send route:", error);
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

