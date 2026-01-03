"use server";

import { saveUserSubscriptionPlan } from "./user.actions";
import type { SubscriptionPlan } from "@/database/models/user-subscription.model";

export async function syncSubscriptionToDatabase(
  userId: string,
  plan: SubscriptionPlan,
  productId?: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  return await saveUserSubscriptionPlan(userId, plan, productId, customerId);
}

