"use server";

import { connectToDatabase } from "@/database/mongoose";
import { PushSubscriptionModel } from "@/database/models/push-subscription.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}


export async function subscribeToPush(
  subscription: PushSubscriptionData
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const existing = await PushSubscriptionModel.findOne({
      endpoint: subscription.endpoint,
    });

    if (existing) {
      if (existing.userId !== session.user.id) {
        existing.userId = session.user.id;
        existing.keys = subscription.keys;
        await existing.save();
      }
      return { success: true };
    }
    await PushSubscriptionModel.create({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    return { success: true };
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    };
  }
}

export async function unsubscribeFromPush(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const result = await PushSubscriptionModel.deleteOne({
      endpoint,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Subscription not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe",
    };
  }
}

export async function getUserPushSubscriptions(): Promise<{
  success: boolean;
  subscriptions?: PushSubscriptionData[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const subscriptions = await PushSubscriptionModel.find({
      userId: session.user.id,
    })
      .select("endpoint keys")
      .lean();

    return {
      success: true,
      subscriptions: subscriptions.map((sub) => ({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      })),
    };
  } catch (error) {
    console.error("Error getting user push subscriptions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get subscriptions",
    };
  }
}

export async function getPushSubscriptionsByUserId(
  userId: string
): Promise<PushSubscriptionData[]> {
  try {
    await connectToDatabase();

    const subscriptions = await PushSubscriptionModel.find({
      userId,
    })
      .select("endpoint keys")
      .lean();

    return subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    }));
  } catch (error) {
    console.error("Error getting push subscriptions by userId:", error);
    return [];
  }
}

