"use server";

import { connectToDatabase } from "@/database/mongoose";
import { auth, getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/services/sms.service";
import { ObjectId } from "mongodb";

export async function getUserSubscriptionPlan(userId: string, userEmail?: string): Promise<"free" | "pro" | "enterprise"> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        if (!db) {
            console.error("[Subscription] Database connection not found");
            return "free";
        }

        const queryConditions: any[] = [
            { userId: userId },
            { "user.id": userId },
            { "user._id": userId }
        ];

        if (userEmail) {
            queryConditions.push(
                { "user.email": userEmail.toLowerCase() },
                { email: userEmail.toLowerCase() }
            );
        }

        const customer = await db.collection("autumn_customers").findOne({
            $or: queryConditions
        });

        if (!customer) {
            console.log(`[Subscription] No customer found for userId: ${userId}${userEmail ? `, email: ${userEmail}` : ""}`);
            
            const allCustomers = await db.collection("autumn_customers").find({}).limit(5).toArray();
            console.log(`[Subscription] Sample customer records:`, allCustomers.map((c: any) => ({
                id: c._id,
                userId: c.userId,
                user: c.user,
                hasProducts: !!c.products,
                productCount: c.products?.length || 0
            })));
            
            return "free";
        }

        if (!customer.products || customer.products.length === 0) {
            console.log(`[Subscription] Customer found but no products for userId: ${userId}`);
            return "free";
        }

        const isActive = (status: string) => status === "active" || status === "trialing";

        console.log(`[Subscription] Checking products for userId: ${userId}`, {
            customerId: customer._id,
            products: customer.products.map((p: any) => ({ 
                id: p.id, 
                productId: p.productId,
                status: p.status,
                name: p.name
            }))
        });

        const hasEnterprise = customer.products.some((p: any) => {
            const productId = p.id || p.productId || p.name;
            const status = p.status;
            const matches = (productId === "enterprise_plan" || 
                          productId === "enterprise" || 
                          productId?.toLowerCase() === "enterprise");
            return matches && isActive(status);
        });
        if (hasEnterprise) {
            console.log(`[Subscription] Enterprise subscription found for userId: ${userId}`);
            return "enterprise";
        }

        const hasPro = customer.products.some((p: any) => {
            const productId = p.id || p.productId || p.name;
            const status = p.status;
            const matches = (productId === "pro_plan" || 
                          productId === "pro" || 
                          productId?.toLowerCase() === "pro");
            return matches && isActive(status);
        });
        if (hasPro) {
            console.log(`[Subscription] Pro subscription found for userId: ${userId}`);
            return "pro";
        }

        console.log(`[Subscription] No active Pro/Enterprise subscription for userId: ${userId}`);
        return "free";
    } catch (error) {
        console.error("Error getting user subscription plan:", error);
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
        console.error("Error fetching portfolio symbols:", error);
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
      console.error(`[User Actions] User not found with id: ${session.user.id}`);
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
    console.error("Error fetching user phone number:", error);
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
      console.error(`[User Actions] No email found in session for user id: ${userId}`);
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
      console.error(`[User Actions] User not found with email: ${userEmail} or id: ${userId}`);
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
      console.error(`[User Actions] Failed to update phone number for user _id:`, userCheck._id);
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
        console.error('Error fetching users for news email:', e)
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
    console.error("Error updating SMS notification preference:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update SMS notification preference",
    };
  }
}
