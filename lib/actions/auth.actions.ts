"use server";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { generateAndSendOTP } from "./otp.actions";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    if (response) {
      // Send OTP for email verification
      const otpResult = await generateAndSendOTP({
        email,
        name: fullName,
      });

      if (!otpResult.success) {
        console.error("Failed to send OTP:", otpResult.error);
        // Still return success but mark that OTP sending failed
        return {
          success: true,
          data: response,
          requiresOTP: true,
          otpSent: false,
          error: "Account created but failed to send OTP",
        };
      }

      // Store user profile data temporarily (we'll send welcome email after OTP verification)
      // For now, just mark that OTP is required
      return {
        success: true,
        data: response,
        requiresOTP: true,
        otpSent: true,
      };
    }

    return { success: false, error: "Sign up failed" };
  } catch (e: any) {
    console.error("Sign up failed", e);
    return { success: false, error: e.message || "Sign up failed" };
  }
};

export const completeSignUp = async ({
  email,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: {
  email: string;
  fullName: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
}) => {
  try {
    // Send welcome email after OTP verification
    await inngest.send({
      name: "app/user.created",
      data: {
        email,
        name: fullName,
        country,
        investmentGoals,
        riskTolerance,
        preferredIndustry,
      },
    });

    return { success: true };
  } catch (e: any) {
    console.error("Failed to complete signup:", e);
    return { success: false, error: "Failed to complete signup" };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
      const response = await auth.api.signInEmail({ body: { email, password } })

      return { success: true, data: response }
  } catch (e) {
      console.error('Sign in failed', e)
      return { success: false, error: 'Sign in failed' }
  }
}

export const signOut = async () => {
  try {
      await auth.api.signOut({ headers: await headers() });
  } catch (e) {
      console.error('Sign out failed', e)
      return { success: false, error: 'Sign out failed' }
  }
}

export const getSession = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return { success: true, user: session?.user || null };
  } catch (e) {
    console.error('Get session failed', e);
    return { success: false, user: null };
  }
}
