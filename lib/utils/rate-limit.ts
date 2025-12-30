"use server";

import { connectToDatabase } from "@/database/mongoose";
import { RateLimitModel } from "@/database/models/rate-limit.model";
import { headers } from "next/headers";

type RateLimitAction = "otp_generate" | "otp_verify" | "otp_resend";



const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  otp_generate: {
    maxAttempts: 3, 
    windowMs: 60 * 60 * 1000, 
    lockDurationMs: 15 * 60 * 1000, 
  },
  otp_verify: {
    maxAttempts: 5, 
    windowMs: 10 * 60 * 1000, 
    lockDurationMs: 5 * 60 * 1000,
  },
  otp_resend: {
    maxAttempts: 2, 
    windowMs: 60 * 60 * 1000, 
    lockDurationMs: 10 * 60 * 1000,
  },
};

export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<{
  isLimited: boolean;
  remainingAttempts: number;
  resetAt?: Date;
  lockedUntil?: Date;
  error?: string;
}> {
  try {
    await connectToDatabase();

    const config = RATE_LIMIT_CONFIGS[action];
    const now = new Date();
    const resetAt = new Date(now.getTime() + config.windowMs);

    // Find existing rate limit record
    let rateLimit = await RateLimitModel.findOne({
      identifier: identifier.toLowerCase(),
      action,
    });

    // Check if locked
    if (rateLimit?.lockedUntil && rateLimit.lockedUntil > now) {
      const minutesLeft = Math.ceil(
        (rateLimit.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
      );
      return {
        isLimited: true,
        remainingAttempts: 0,
        lockedUntil: rateLimit.lockedUntil,
        error: `Too many attempts. Please try again in ${minutesLeft} minute(s).`,
      };
    }

    // If locked period expired, remove the lock
    if (rateLimit?.lockedUntil && rateLimit.lockedUntil <= now) {
      rateLimit.lockedUntil = undefined;
      rateLimit.attempts = 0;
    }

    // If no record exists or window expired, create/reset
    if (!rateLimit || rateLimit.resetAt <= now) {
      if (rateLimit) {
        // Reset existing record
        rateLimit.attempts = 1;
        rateLimit.resetAt = resetAt;
        rateLimit.lockedUntil = undefined;
        await rateLimit.save();
      } else {
        // Create new record
        rateLimit = await RateLimitModel.create({
          identifier: identifier.toLowerCase(),
          action,
          attempts: 1,
          resetAt,
        });
      }

      return {
        isLimited: false,
        remainingAttempts: config.maxAttempts - 1,
        resetAt,
      };
    }

    // Check if attempts exceeded
    if (rateLimit.attempts >= config.maxAttempts) {
      if (config.lockDurationMs) {
        const lockedUntil = new Date(now.getTime() + config.lockDurationMs);
        rateLimit.lockedUntil = lockedUntil;
        await rateLimit.save();

        const minutesLeft = Math.ceil(config.lockDurationMs / (60 * 1000));
        return {
          isLimited: true,
          remainingAttempts: 0,
          lockedUntil,
          error: `Rate limit exceeded. Please try again in ${minutesLeft} minute(s).`,
        };
      }

      // Without lock, just block until reset time
      const minutesLeft = Math.ceil(
        (rateLimit.resetAt.getTime() - now.getTime()) / (60 * 1000)
      );
      return {
        isLimited: true,
        remainingAttempts: 0,
        resetAt: rateLimit.resetAt,
        error: `Too many attempts. Please try again in ${minutesLeft} minute(s).`,
      };
    }

    rateLimit.attempts += 1;
    await rateLimit.save();

    return {
      isLimited: false,
      remainingAttempts: config.maxAttempts - rateLimit.attempts,
      resetAt: rateLimit.resetAt,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return {
      isLimited: false,
      remainingAttempts: 0,
      error: "Rate limit check failed",
    };
  }
}


export async function getClientIP(): Promise<string> {
  const headersList = await headers();
 
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";
  return ip;
}


export async function resetRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<void> {
  try {
    await connectToDatabase();
    await RateLimitModel.deleteOne({
      identifier: identifier.toLowerCase(),
      action,
    });
  } catch (error) {
    console.error("Error resetting rate limit:", error);
  }
}

