"use server";

import { saveUserSubscriptionPlan, getUserSubscriptionPlan } from "./user.actions";
import type { SubscriptionPlan } from "@/database/models/user-subscription.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function syncSubscriptionToDatabase(
  userId: string,
  plan: SubscriptionPlan,
  productId?: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  return await saveUserSubscriptionPlan(userId, plan, productId, customerId);
}

export async function getCurrentUserSubscriptionPlan(): Promise<{
  success: boolean;
  plan?: SubscriptionPlan;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated", plan: "free" };
    }

    const plan = await getUserSubscriptionPlan(session.user.id, session.user.email);
    return { success: true, plan };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get subscription plan",
      plan: "free",
    };
  }
}

