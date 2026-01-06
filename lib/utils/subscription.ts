"use server";

import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";


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

    return {
      plan: "free",
    };
  } catch (error) {
    return { plan: "free" };
  }
}

export async function getSubscriptionLimits(plan: SubscriptionPlan): Promise<SubscriptionLimits> {
  switch (plan) {
    case "free":
      return {
        maxStocks: 5,
        maxWatchlistStocks: 5,
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
        maxWatchlistStocks: null,
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
        maxWatchlistStocks: null,
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
    
    return true;
  } catch (error) {
    return false;
  }
}


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
    
    if (limits.maxStocks === null) {
      return {
        allowed: true,
        currentCount: currentStockCount,
        limit: null,
      };
    }
    
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
    return {
      allowed: true,
      currentCount: currentAlertCount,
      limit: null,
    };
  }
}

export async function enforceWatchlistLimit(
  currentWatchlistCount: number
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
    
    if (limits.maxWatchlistStocks === null) {
      return {
        allowed: true,
        currentCount: currentWatchlistCount,
        limit: null,
      };
    }
    
    if (currentWatchlistCount >= limits.maxWatchlistStocks) {
      return {
        allowed: false,
        reason: `You've reached the limit of ${limits.maxWatchlistStocks} stocks for your ${subscription.plan} plan. Upgrade to Pro for unlimited watchlist tracking.`,
        upgradeRequired: true,
        currentCount: currentWatchlistCount,
        limit: limits.maxWatchlistStocks,
      };
    }
    
    return {
      allowed: true,
      currentCount: currentWatchlistCount,
      limit: limits.maxWatchlistStocks,
    };
  } catch (error) {
    return {
      allowed: true,
      currentCount: currentWatchlistCount,
      limit: null,
    };
  }
}

