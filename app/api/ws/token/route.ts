import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getUserSubscriptionPlan } from "@/lib/actions/user.actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const plan = await getUserSubscriptionPlan(session.user.id, session.user.email);
    
    console.log(`[WS Token] User ${session.user.id} (${session.user.email}) subscription plan: ${plan}`);
    
    if (plan !== "pro" && plan !== "enterprise") {
      console.log(`[WS Token] Access denied for user ${session.user.id} - plan: ${plan}`);
      return NextResponse.json(
        { error: "Pro subscription required", plan },
        { status: 403 }
      );
    }
    
    console.log(`[WS Token] Access granted for user ${session.user.id} - plan: ${plan}`);

    return NextResponse.json({
      userId: session.user.id,
      token: session.user.id,
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080",
    });
  } catch (error) {
    console.error("Error generating WebSocket token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

