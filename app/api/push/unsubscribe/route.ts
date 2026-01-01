import { NextRequest, NextResponse } from "next/server";
import { unsubscribeFromPush } from "@/lib/actions/push.actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint is required" },
        { status: 400 }
      );
    }

    const result = await unsubscribeFromPush(endpoint);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to unsubscribe" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in push unsubscribe route:", error);
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

