import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getUserSubscriptionPlan } from "@/lib/actions/user.actions";
import { sendChatMessage } from "@/lib/services/ai-chat.service";
import { buildSupportContext } from "@/lib/services/support-context.service";
import { ChatMessage } from "@/types/support-chat";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const plan = await getUserSubscriptionPlan(userId);
    
    if (plan === "free") {
      return NextResponse.json(
        { error: "Pro or Enterprise subscription required for AI chat support" },
        { status: 403 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "chat_message");
    if (rateLimitResult.isLimited) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error || "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.lockedUntil 
            ? Math.ceil((rateLimitResult.lockedUntil.getTime() - Date.now()) / 1000)
            : rateLimitResult.resetAt
            ? Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            : 60
        },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.lockedUntil 
              ? Math.ceil((rateLimitResult.lockedUntil.getTime() - Date.now()) / 1000).toString()
              : rateLimitResult.resetAt
              ? Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString()
              : "60"
          }
        }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }

    if (conversationHistory.length > 50) {
      return NextResponse.json(
        { error: "Conversation history is too long. Please start a new conversation." },
        { status: 400 }
      );
    }

    const context = await buildSupportContext();
    if (!context) {
      return NextResponse.json(
        { error: "Failed to load user context" },
        { status: 500 }
      );
    }

    const history: ChatMessage[] = conversationHistory.map((msg: any) => ({
      id: msg.id || Math.random().toString(36),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now()),
      state: "sent",
    }));

    const response = await sendChatMessage(message, history, context);

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: response.message,
      rateLimit: {
        remaining: rateLimitResult.remainingAttempts,
        resetAt: rateLimitResult.resetAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while processing your message. Please try again." },
      { status: 500 }
    );
  }
}

