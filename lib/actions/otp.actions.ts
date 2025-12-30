"use server";

import { connectToDatabase } from "@/database/mongoose";
import { OTPModel } from "@/database/models/otp.model";
import { sendOTPEmail } from "@/lib/nodemailer";
import { completeSignUp } from "./auth.actions";
import { checkRateLimit, getClientIP, resetRateLimit } from "@/lib/utils/rate-limit";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const generateAndSendOTP = async ({
  email,
  name,
}: {
  email: string;
  name: string;
}) => {
  try {
    await connectToDatabase();

    // Check rate limit for OTP generation
    const ip = await getClientIP();
    const rateLimitCheck = await checkRateLimit(
      email,
      "otp_generate"
    );

    if (rateLimitCheck.isLimited) {
      return {
        success: false,
        error: rateLimitCheck.error || "Too many OTP requests. Please try again later.",
        rateLimitInfo: {
          remainingAttempts: rateLimitCheck.remainingAttempts,
          resetAt: rateLimitCheck.resetAt,
          lockedUntil: rateLimitCheck.lockedUntil,
        },
      };
    }

    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); 

    // Delete any existing OTPs for this email
    await OTPModel.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    await OTPModel.create({
      email: email.toLowerCase(),
      code: otpCode,
      expiresAt,
      verified: false,
    });

    // Send OTP email
    await sendOTPEmail({
      email,
      name,
      otpCode,
    });

    return {
      success: true,
      message: "OTP sent successfully",
      rateLimitInfo: {
        remainingAttempts: rateLimitCheck.remainingAttempts,
        resetAt: rateLimitCheck.resetAt,
      },
    };
  } catch (error) {
    console.error("Error generating OTP:", error);
    return { success: false, error: "Failed to send OTP" };
  }
};

export const verifyOTP = async ({
  email,
  code,
  userData,
}: {
  email: string;
  code: string;
  userData?: {
    fullName: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
  };
}) => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");

    // Check rate limit for OTP verification (prevent brute force)
    // Use email as identifier to limit attempts per email
    const rateLimitCheck = await checkRateLimit(
      email.toLowerCase(),
      "otp_verify"
    );

    if (rateLimitCheck.isLimited) {
      return {
        success: false,
        error:
          rateLimitCheck.error ||
          "Too many verification attempts. Please request a new OTP code.",
        rateLimitInfo: {
          remainingAttempts: rateLimitCheck.remainingAttempts,
          resetAt: rateLimitCheck.resetAt,
          lockedUntil: rateLimitCheck.lockedUntil,
        },
      };
    }

    // Find the OTP
    const otp = await OTPModel.findOne({
      email: email.toLowerCase(),
      code,
      verified: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!otp) {
      return {
        success: false,
        error: "Invalid or expired OTP code. Please request a new one.",
        rateLimitInfo: {
          remainingAttempts: rateLimitCheck.remainingAttempts,
          resetAt: rateLimitCheck.resetAt,
        },
      };
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    // Update user's emailVerified status in the user collection
    await db.collection("user").updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          emailVerified: true,
          updatedAt: new Date()
        } 
      }
    );

    // Reset rate limits on successful verification
    await resetRateLimit(email.toLowerCase(), "otp_verify");
    await resetRateLimit(email.toLowerCase(), "otp_generate");

    // Complete signup process (send welcome email)
    if (userData) {
      await completeSignUp({
        email,
        ...userData,
      });
    }

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Failed to verify OTP" };
  }
};

export const resendOTP = async ({
  email,
  name,
}: {
  email: string;
  name: string;
}) => {
  try {
    await connectToDatabase();

    // Check rate limit specifically for resend
    const rateLimitCheck = await checkRateLimit(email, "otp_resend");

    if (rateLimitCheck.isLimited) {
      return {
        success: false,
        error:
          rateLimitCheck.error ||
          "Too many resend requests. Please try again later.",
        rateLimitInfo: {
          remainingAttempts: rateLimitCheck.remainingAttempts,
          resetAt: rateLimitCheck.resetAt,
          lockedUntil: rateLimitCheck.lockedUntil,
        },
      };
    }

    // Proceed with resending OTP
    return await generateAndSendOTP({ email, name });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return { success: false, error: "Failed to resend OTP" };
  }
};

