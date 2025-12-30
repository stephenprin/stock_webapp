import { NextRequest } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { autumnHandler } from "autumn-js/next";

const handler = autumnHandler({
  identify: async (request: NextRequest) => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) {
        return null;
      }

      return {
        customerId: session.user.id,
        customerData: {
          name: session.user.name || undefined,
          email: session.user.email || undefined,
        },
      };
    } catch (error) {
      return null;
    }
  },
  secretKey: process.env.AUTUMN_SECRET_KEY?.trim(),
  url: process.env.AUTUMN_API_URL?.trim() || "https://api.useautumn.com/v1",
  suppressLogs: false,
});

// Wrap handlers to add logging and better error handling
async function handleRequest(
  method: "GET" | "POST",
  request: NextRequest
) {
  try {
    
    if (!process.env.AUTUMN_SECRET_KEY?.trim()) {
      console.error("AUTUMN_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Autumn secret key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const response = method === "GET" 
      ? await handler.GET(request)
      : await handler.POST(request);
    return response;
  } catch (error: any) {
    console.error(`Autumn ${method} handler error:`, error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error?.message || "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const GET = (request: NextRequest) => handleRequest("GET", request);
export const POST = (request: NextRequest) => handleRequest("POST", request);

