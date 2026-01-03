"use server";

import { connectToDatabase } from "@/database/mongoose";
import { auth, getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/services/sms.service";
import { ObjectId } from "mongodb";
import { UserSubscriptionModel, type SubscriptionPlan } from "@/database/models/user-subscription.model";

export async function saveUserSubscriptionPlan(
  userId: string,
  plan: SubscriptionPlan,
  productId?: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    
    await UserSubscriptionModel.findOneAndUpdate(
      { userId },
      {
        userId,
        plan,
        productId,
        customerId,
        lastSyncedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save subscription plan",
    };
  }
}

export async function getUserSubscriptionPlan(userId: string, userEmail?: string): Promise<"free" | "pro" | "enterprise"> {
    try {
        // First, check local database cache
        await connectToDatabase();
        const localSubscription = await UserSubscriptionModel.findOne({ userId }).lean();
        
        if (localSubscription && localSubscription.plan !== "free") {
            return localSubscription.plan;
        }
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        if (!db) {
            return "free";
        }
        const queryConditions: any[] = [
            { userId: userId },
            { "user.id": userId },
            { "user._id": userId },
            { "user._id": new (await import("mongodb")).ObjectId(userId) },
        ];

        if (userEmail) {
            queryConditions.push(
                { "user.email": userEmail.toLowerCase() },
                { "user.email": userEmail },
                { email: userEmail.toLowerCase() },
                { email: userEmail }
            );
        }

        const customer = await db.collection("autumn_customers").findOne({
            $or: queryConditions
        });

        if (!customer) {
            const allCustomers = await db.collection("autumn_customers").find({}).toArray();
            
            const alternativeCustomer = allCustomers.find((c: any) => {
                if (c.userId === userId) return true;
                if (c.user?.id === userId) return true;
                if (c.user?._id?.toString() === userId) return true;
                if (userEmail && (c.user?.email?.toLowerCase() === userEmail.toLowerCase() || c.email?.toLowerCase() === userEmail.toLowerCase())) return true;
                return false;
            });
            
            if (alternativeCustomer) {
                return await checkCustomerProducts(alternativeCustomer, userId);
            }
            
            await saveUserSubscriptionPlan(userId, "free");
            return "free";
        }

        return await checkCustomerProducts(customer, userId);
    } catch (error) {
        return "free";
    }
}

async function checkCustomerProducts(customer: any, userId: string): Promise<"free" | "pro" | "enterprise"> {
    try {
        if (!customer.products || customer.products.length === 0) {
            return "free";
        }

        const isActive = (status: string) => status === "active" || status === "trialing";

        const hasEnterprise = customer.products.some((p: any) => {
            const productId = p.id;
            const status = p.status;
            const productIdAlt = p.productId || p.name;
            const productIdLower = String(productId || productIdAlt || "").toLowerCase();
            const matches = (productId === "enterprise_plan" || 
                          productId === "enterprise" || 
                          productIdAlt === "enterprise_plan" ||
                          productIdAlt === "enterprise" ||
                          productIdLower === "enterprise" ||
                          productIdLower.includes("enterprise"));
            const active = isActive(status);
            return matches && active;
        });
        
        if (hasEnterprise) {
            const enterpriseProduct = customer.products.find((p: any) => 
                (p.id === "enterprise_plan" || p.id === "enterprise") && isActive(p.status)
            );
            await saveUserSubscriptionPlan(userId, "enterprise", enterpriseProduct?.id, customer.userId || customer._id?.toString());
            return "enterprise";
        }

        const hasPro = customer.products.some((p: any) => {
            const productId = p.id;
            const status = p.status;
            const productIdAlt = p.productId || p.name;
            const productIdLower = String(productId || productIdAlt || "").toLowerCase();
            const matches = (productId === "pro_plan" || 
                          productId === "pro" || 
                          productIdAlt === "pro_plan" ||
                          productIdAlt === "pro" ||
                          productIdLower === "pro" ||
                          productIdLower.includes("pro"));
            const active = isActive(status);
            return matches && active;
        });
        
        if (hasPro) {
            const proProduct = customer.products.find((p: any) => 
                (p.id === "pro_plan" || p.id === "pro") && isActive(p.status)
            );
            await saveUserSubscriptionPlan(userId, "pro", proProduct?.id, customer.userId || customer._id?.toString());
            return "pro";
        }

        await saveUserSubscriptionPlan(userId, "free");
        return "free";
    } catch (error) {
        return "free";
    }
}

export async function getPortfolioSymbolsByUserId(userId: string): Promise<string[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) return [];

        const { PortfolioHoldingModel } = await import("@/database/models/portfolio-holding.model");
        const holdings = await PortfolioHoldingModel.find({ userId })
            .select("symbol")
            .lean();

        return holdings.map((h) => String(h.symbol));
    } catch (error) {
        return [];
    }
}

export async function getUserPhoneNumber(): Promise<{
  success: boolean;
  phoneNumber?: string;
  smsNotificationsEnabled?: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return {
        success: false,
        error: "Database connection not found",
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    let user = await db.collection("user").findOne<{ phoneNumber?: string; smsNotificationsEnabled?: boolean; id?: string; _id?: any; email?: string }>(
      { id: userId },
      { projection: { phoneNumber: 1, smsNotificationsEnabled: 1, id: 1, _id: 1, email: 1 } }
    );

    if (!user && ObjectId.isValid(userId)) {
      user = await db.collection("user").findOne<{ phoneNumber?: string; smsNotificationsEnabled?: boolean; id?: string; _id?: any; email?: string }>(
        { _id: new ObjectId(userId) },
        { projection: { phoneNumber: 1, smsNotificationsEnabled: 1, id: 1, _id: 1, email: 1 } }
      );
    }

    if (!user && userEmail) {
      user = await db.collection("user").findOne<{ phoneNumber?: string; smsNotificationsEnabled?: boolean; id?: string; _id?: any; email?: string }>(
        { email: userEmail.toLowerCase() },
        { projection: { phoneNumber: 1, smsNotificationsEnabled: 1, id: 1, _id: 1, email: 1 } }
      );
    }

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      phoneNumber: user?.phoneNumber || undefined,
      smsNotificationsEnabled: user?.smsNotificationsEnabled !== false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch phone number",
    };
  }
}

export async function updateUserPhoneNumber(phoneNumber: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (!phoneNumber || phoneNumber.trim() === "") {
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      
      if (!db) {
        return {
          success: false,
          error: "Database connection not found",
        };
      }

      const userId = session.user.id;
      const userEmail = session.user.email;
      
      let userCheck = await db.collection("user").findOne(
        { email: userEmail?.toLowerCase() },
        { projection: { _id: 1 } }
      );

      if (!userCheck && ObjectId.isValid(userId)) {
        userCheck = await db.collection("user").findOne(
          { _id: new ObjectId(userId) },
          { projection: { _id: 1 } }
        );
      }

      if (userCheck) {
        await db.collection("user").updateOne(
          { _id: userCheck._id },
          { $unset: { phoneNumber: "" }, $set: { updatedAt: new Date() } }
        );
      }

      return {
        success: true,
      };
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return {
        success: false,
        error: "Database connection not found",
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return {
        success: false,
        error: "User email not found",
      };
    }

    let userCheck = await db.collection("user").findOne(
      { email: userEmail.toLowerCase() },
      { projection: { _id: 1, email: 1 } }
    );

    if (!userCheck) {
      if (ObjectId.isValid(userId)) {
        userCheck = await db.collection("user").findOne(
          { _id: new ObjectId(userId) },
          { projection: { _id: 1, email: 1 } }
        );
      }
    }

    if (!userCheck) {
      return {
        success: false,
        error: "User not found in database",
      };
    }

    const updateResult = await db.collection("user").updateOne(
      { _id: userCheck._id },
      { $set: { phoneNumber: formattedPhone, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      return {
        success: false,
        error: "Failed to update phone number",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update phone number",
    };
  }
}

export async function getAllUsersForNewsEmail(): Promise<Array<{ 
    id: string; 
    email: string; 
    name: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}>> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1, investmentGoals: 1, riskTolerance: 1, preferredIndustry: 1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name,
            investmentGoals: user.investmentGoals,
            riskTolerance: user.riskTolerance,
            preferredIndustry: user.preferredIndustry,
        }))
    } catch (e) {
        return []
    }
}

export async function updateSMSNotificationsEnabled(enabled: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return {
        success: false,
        error: "User email not found",
      };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return {
        success: false,
        error: "Database connection not found",
      };
    }

    let userCheck = await db.collection("user").findOne(
      { email: userEmail.toLowerCase() },
      { projection: { _id: 1 } }
    );

    if (!userCheck && ObjectId.isValid(userId)) {
      userCheck = await db.collection("user").findOne(
        { _id: new ObjectId(userId) },
        { projection: { _id: 1 } }
      );
    }

    if (!userCheck) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const updateResult = await db.collection("user").updateOne(
      { _id: userCheck._id },
      { $set: { smsNotificationsEnabled: enabled, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      return {
        success: false,
        error: "Failed to update SMS notification preference",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update SMS notification preference",
    };
  }
}
