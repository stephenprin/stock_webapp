"use server";

import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { PriceAlertModel } from "@/database/models/price-alert.model";
import { getStockQuote } from "./finnhub.actions";
import { checkSubscriptionStatus, getSubscriptionLimits } from "@/lib/utils/subscription";

import type { AlertSubType, Condition, TechnicalIndicatorConfig } from "@/database/models/price-alert.model";

export interface CreatePriceAlertData {
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  alertSubType?: AlertSubType;
  threshold?: number;
  conditions?: Condition[];
  conditionLogic?: "AND" | "OR";
  technicalIndicator?: TechnicalIndicatorConfig;
  percentageThreshold?: number;
}

export async function createPriceAlert(
  data: CreatePriceAlertData
): Promise<{
  success: boolean;
  alert?: PriceAlertPlain;
  error?: string;
  upgradeRequired?: boolean;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to create alerts",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    
    const subscription = await checkSubscriptionStatus();
    const limits = await getSubscriptionLimits(subscription.plan);

 
    const currentAlertCount = await PriceAlertModel.countDocuments({
      userId,
      isActive: true,
    });

   
    const maxAlerts = subscription.plan === "free" ? 5 : null;
    if (maxAlerts !== null && currentAlertCount >= maxAlerts) {
      return {
        success: false,
        error: `You've reached the limit of ${maxAlerts} alerts for your free plan. Upgrade to Pro for unlimited alerts.`,
        upgradeRequired: true,
      };
    }

    const alertSubType = data.alertSubType || "price";

    if (alertSubType === "price" || alertSubType === "volume") {
      if (!data.threshold || data.threshold <= 0) {
        return {
          success: false,
          error: "Threshold must be greater than 0",
        };
      }
    }

    if (alertSubType === "percentage") {
      if (data.percentageThreshold === undefined || data.percentageThreshold === null) {
        return {
          success: false,
          error: "Percentage threshold is required for percentage alerts",
        };
      }
    }

    if (alertSubType === "technical") {
      if (!data.technicalIndicator && (!data.conditions || data.conditions.length === 0)) {
        return {
          success: false,
          error: "Technical indicator config or conditions are required for technical alerts",
        };
      }
    }

    const existingAlert = await PriceAlertModel.findOne({
      userId,
      symbol: data.symbol.toUpperCase(),
      alertType: data.alertType,
      alertSubType,
      alertName: data.alertName.trim(),
    });

    if (existingAlert) {
      return {
        success: false,
        error: `You already have a ${data.alertType} ${alertSubType} alert named "${data.alertName}" for ${data.symbol.toUpperCase()}. Please update or delete the existing alert.`,
      };
    }

    const alert = await PriceAlertModel.create({
      userId,
      symbol: data.symbol.toUpperCase(),
      company: data.company,
      alertName: data.alertName.trim(),
      alertType: data.alertType,
      alertSubType,
      threshold: data.threshold,
      conditions: data.conditions,
      conditionLogic: data.conditionLogic || "AND",
      technicalIndicator: data.technicalIndicator,
      percentageThreshold: data.percentageThreshold,
      isActive: true,
    });

    return {
      success: true,
      alert: {
        ...alert.toObject(),
        _id: alert._id.toString(),
      } as PriceAlertPlain,
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        error: "An alert with this symbol and type already exists",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create alert",
    };
  }
}

export interface PriceAlertPlain {
  _id: string;
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  alertSubType?: AlertSubType;
  threshold?: number;
  conditions?: Condition[];
  conditionLogic?: "AND" | "OR";
  technicalIndicator?: TechnicalIndicatorConfig;
  percentageThreshold?: number;
  previousDayClose?: number;
  isActive: boolean;
  triggeredAt?: Date;
  currentPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserAlerts(): Promise<{
  success: boolean;
  alerts?: PriceAlertPlain[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to view alerts",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const alerts = await PriceAlertModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();


    const symbols = [...new Set(alerts.map((alert) => alert.symbol))];
    const priceMap = new Map<string, number>();

    if (symbols.length > 0) {
      try {
        const quotes = await Promise.all(
          symbols.map((symbol) => getStockQuote(symbol))
        );

        quotes.forEach((quote, index) => {
          if (quote && quote.currentPrice) {
            priceMap.set(symbols[index], quote.currentPrice);
          }
        });
      } catch (error) {
      }
    }

    const alertsWithPrices: PriceAlertPlain[] = alerts.map((alert) => ({
      ...alert,
      currentPrice: priceMap.get(alert.symbol),
      _id: (alert._id as any)?.toString(),
    }));

    return {
      success: true,
      alerts: alertsWithPrices,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch alerts",
    };
  }
}

export async function updatePriceAlert(
  alertId: string,
  updates: {
    alertName?: string;
    threshold?: number;
  }
): Promise<{
  success: boolean;
  alert?: PriceAlertPlain;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to update alerts",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const alert = await PriceAlertModel.findOne({
      _id: alertId,
      userId,
    });

    if (!alert) {
      return {
        success: false,
        error: "Alert not found or you don't have permission to update it",
      };
    }

    if (updates.threshold !== undefined && updates.threshold <= 0) {
      return {
        success: false,
        error: "Threshold must be greater than 0",
      };
    }

    if (updates.alertName !== undefined) {
      alert.alertName = updates.alertName.trim();
    }
    if (updates.threshold !== undefined) {
      alert.threshold = updates.threshold;
      alert.triggeredAt = undefined;
    }

    await alert.save();

    return {
      success: true,
      alert: {
        ...alert.toObject(),
        _id: alert._id.toString(),
      } as PriceAlertPlain,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update alert",
    };
  }
}

export async function deletePriceAlert(
  alertId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to delete alerts",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;


    const result = await PriceAlertModel.deleteOne({
      _id: alertId,
      userId,
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        error: "Alert not found or you don't have permission to delete it",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete alert",
    };
  }
}

export async function toggleAlertStatus(
  alertId: string
): Promise<{
  success: boolean;
  alert?: PriceAlertPlain;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to toggle alert status",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const alert = await PriceAlertModel.findOne({
      _id: alertId,
      userId,
    });

    if (!alert) {
      return {
        success: false,
        error: "Alert not found or you don't have permission to modify it",
      };
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    return {
      success: true,
      alert: {
        ...alert.toObject(),
        _id: alert._id.toString(),
      } as PriceAlertPlain,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to toggle alert status",
    };
  }
}

