"use server";

import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

/**
 * Check user's current subscription status from Autumn
 * Returns the plan and customer information
 */
export async function checkSubscriptionStatus(): Promise<{
  plan: SubscriptionPlan;
  customerId?: string;
  status?: "active" | "inactive" | "cancelled" | "past_due";
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { plan: "free" };
    }

    // TODO: Integrate with Autumn API to get actual subscription status
    // For now, default to free tier for all users
    // This will be updated once Autumn customer records are created
    return {
      plan: "free",
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    // Default to free on error
    return { plan: "free" };
  }
}

/**
 * Get subscription limits based on plan
 */
export async function getSubscriptionLimits(plan: SubscriptionPlan): Promise<SubscriptionLimits> {
  switch (plan) {
    case "free":
      return {
        maxStocks: 10,
        maxAlerts: 5,
        alerts: "basic",
        newsPriority: "standard",
        analytics: false,
        apiAccess: false,
        multiplePortfolios: false,
        teamCollaboration: false,
        dedicatedSupport: false,
      };
    
    case "pro":
      return {
        maxStocks: null,
        maxAlerts: null,
        alerts: "advanced",
        newsPriority: "priority",
        analytics: true,
        apiAccess: false,
        multiplePortfolios: false,
        teamCollaboration: false,
        dedicatedSupport: false,
      };
    
    case "enterprise":
      return {
        maxStocks: null,
        maxAlerts: null,
        alerts: "custom",
        newsPriority: "premium",
        analytics: true,
        apiAccess: true,
        multiplePortfolios: true,
        teamCollaboration: true,
        dedicatedSupport: true,
      };
    
    default:
      return await getSubscriptionLimits("free");
  }
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(
  featureName: keyof SubscriptionLimits
): Promise<boolean> {
  try {
    const subscription = await checkSubscriptionStatus();
    const limits = await getSubscriptionLimits(subscription.plan);
    
    const feature = limits[featureName];
    
    if (typeof feature === "boolean") {
      return feature;
    }
    
    // For other features, we can add more complex logic later
    return true;
  } catch (error) {
    console.error("Error checking feature access:", error);
    return false;
  }
}

/**
 * Enforce stock limit based on user's subscription
 * Returns whether the user can add more stocks
 */
export async function enforceStockLimit(
  userId: string,
  currentStockCount: number
): Promise<{
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentCount: number;
  limit: number | null;
}> {
  try {
    const subscription = await checkSubscriptionStatus();
    const limits = await getSubscriptionLimits(subscription.plan);
    
    // If unlimited (null), always allow
    if (limits.maxStocks === null) {
      return {
        allowed: true,
        currentCount: currentStockCount,
        limit: null,
      };
    }
    
    // Check if user has reached the limit
    if (currentStockCount >= limits.maxStocks) {
      return {
        allowed: false,
        reason: `You've reached the limit of ${limits.maxStocks} stocks for your ${subscription.plan} plan. Upgrade to Pro for unlimited stock tracking.`,
        upgradeRequired: true,
        currentCount: currentStockCount,
        limit: limits.maxStocks,
      };
    }
    
    return {
      allowed: true,
      currentCount: currentStockCount,
      limit: limits.maxStocks,
    };
  } catch (error) {
    console.error("Error enforcing stock limit:", error);
    return {
      allowed: true,
      currentCount: currentStockCount,
      limit: null,
    };
  }
}


export async function enforceAlertLimit(
  currentAlertCount: number
): Promise<{
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentCount: number;
  limit: number | null;
}> {
  try {
    const subscription = await checkSubscriptionStatus();
    const limits = await getSubscriptionLimits(subscription.plan);
    
    if (limits.maxAlerts === null) {
      return {
        allowed: true,
        currentCount: currentAlertCount,
        limit: null,
      };
    }
    
    if (currentAlertCount >= limits.maxAlerts) {
      return {
        allowed: false,
        reason: `You've reached the limit of ${limits.maxAlerts} alerts for your ${subscription.plan} plan. Upgrade to Pro for unlimited alerts.`,
        upgradeRequired: true,
        currentCount: currentAlertCount,
        limit: limits.maxAlerts,
      };
    }
    
    return {
      allowed: true,
      currentCount: currentAlertCount,
      limit: limits.maxAlerts,
    };
  } catch (error) {
    console.error("Error enforcing alert limit:", error);
    return {
      allowed: true,
      currentCount: currentAlertCount,
      limit: null,
    };
  }
}

