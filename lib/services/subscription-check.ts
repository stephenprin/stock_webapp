/**
 * Standalone subscription check function for WebSocket server
 * This avoids importing auth.ts which has top-level await
 */

import { connectToDatabase } from "@/database/mongoose";
import { UserSubscriptionModel } from "@/database/models/user-subscription.model";

export async function checkUserSubscriptionPlan(userId: string): Promise<"free" | "pro" | "enterprise"> {
  try {
    // First, check local database cache
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return "free";
    }
    
    // Try using the model first (fastest)
    let localSubscription = await UserSubscriptionModel.findOne({ userId }).lean();
    
    // If model query fails, try direct collection query (Mongoose pluralizes names)
    if (!localSubscription) {
      // Try the standard Mongoose pluralized collection name
      try {
        const collection = db.collection("usersubscriptions");
        const doc = await collection.findOne({ userId });
        if (doc) {
          localSubscription = doc as any;
        }
      } catch (err) {
        // Collection doesn't exist, skip
      }
    }
    
    if (localSubscription && localSubscription.plan !== "free") {
      // Fast path: return cached non-free subscription immediately
      return localSubscription.plan as "pro" | "enterprise";
    }
    
    // If not found or free, check Autumn database as fallback
    // (db already available from above)

    // Try multiple query strategies to find the customer
    const queryConditions: any[] = [
      { userId: userId },
      { "user.id": userId },
      { "user._id": userId },
    ];

    const customer = await db.collection("autumn_customers").findOne({
      $or: queryConditions
    });

    if (!customer) {
      // Save free status to local database
      await UserSubscriptionModel.findOneAndUpdate(
        { userId },
        { userId, plan: "free", lastSyncedAt: new Date() },
        { upsert: true, new: true }
      ).catch(() => {}); // Fail silently
      return "free";
    }

    // Check customer products
    if (!customer.products || customer.products.length === 0) {
      return "free";
    }

    const isActive = (status: string) => status === "active" || status === "trialing";

    // Check for Enterprise
    const hasEnterprise = customer.products.some((p: any) => {
      const productId = p.id;
      const productIdAlt = p.productId || p.name;
      const productIdLower = String(productId || productIdAlt || "").toLowerCase();
      const matches = (productId === "enterprise_plan" || 
                    productId === "enterprise" || 
                    productIdAlt === "enterprise_plan" ||
                    productIdAlt === "enterprise" ||
                    productIdLower === "enterprise" ||
                    productIdLower.includes("enterprise"));
      return matches && isActive(p.status);
    });

    if (hasEnterprise) {
      const enterpriseProduct = customer.products.find((p: any) => 
        (p.id === "enterprise_plan" || p.id === "enterprise") && isActive(p.status)
      );
      // Save to cache (async, don't wait)
      UserSubscriptionModel.findOneAndUpdate(
        { userId },
        {
          userId,
          plan: "enterprise",
          productId: enterpriseProduct?.id,
          customerId: customer.userId || customer._id?.toString(),
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      ).catch(() => {}); // Fail silently
      return "enterprise";
    }

    // Check for Pro
    const hasPro = customer.products.some((p: any) => {
      const productId = p.id;
      const productIdAlt = p.productId || p.name;
      const productIdLower = String(productId || productIdAlt || "").toLowerCase();
      const matches = (productId === "pro_plan" || 
                    productId === "pro" || 
                    productIdAlt === "pro_plan" ||
                    productIdAlt === "pro" ||
                    productIdLower === "pro" ||
                    productIdLower.includes("pro"));
      return matches && isActive(p.status);
    });

    if (hasPro) {
      const proProduct = customer.products.find((p: any) => 
        (p.id === "pro_plan" || p.id === "pro") && isActive(p.status)
      );
      // Save to cache (async, don't wait)
      UserSubscriptionModel.findOneAndUpdate(
        { userId },
        {
          userId,
          plan: "pro",
          productId: proProduct?.id,
          customerId: customer.userId || customer._id?.toString(),
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      ).catch(() => {}); // Fail silently
      return "pro";
    }

    // Save free status to local database (async, don't wait)
    UserSubscriptionModel.findOneAndUpdate(
      { userId },
      { userId, plan: "free", lastSyncedAt: new Date() },
      { upsert: true, new: true }
    ).catch(() => {}); // Fail silently
    return "free";
  } catch (error) {
    return "free";
  }
}

