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

export const signInWithGoogle = async (): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Use APP_URL for callback, BETTER_AUTH_URL for auth endpoints
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL?.replace('/api/auth', '') || 'http://localhost:3000';
    const authBaseUrl = process.env.BETTER_AUTH_URL || `${appUrl}/api/auth`;
    
    const callbackURL = `${appUrl}/dashboard`;
    const oauthUrl = new URL("/api/auth/sign-in", authBaseUrl);
    oauthUrl.searchParams.set("provider", "google");
    oauthUrl.searchParams.set("callbackURL", callbackURL);
    
    return { success: true, url: oauthUrl.toString() };
  } catch (e: any) {
    console.error("Google sign-in failed", e);
    return { 
      success: false, 
      error: e.message || "Failed to initiate Google sign-in" 
    };
  }
};

export const signUpWithGoogle = async (): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> => {
  try {
    // Use APP_URL for callback, BETTER_AUTH_URL for auth endpoints
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL?.replace('/api/auth', '') || 'http://localhost:3000';
    const authBaseUrl = process.env.BETTER_AUTH_URL || `${appUrl}/api/auth`;

    // Redirect to profile completion after OAuth
    const callbackURL = `${appUrl}/complete-profile`;

    const oauthUrl = new URL("/api/auth/sign-in", authBaseUrl);
    oauthUrl.searchParams.set("provider", "google");
    oauthUrl.searchParams.set("callbackURL", callbackURL);

    return { success: true, url: oauthUrl.toString() };
  } catch (error: unknown) {
    console.error("Google sign-up failed", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate Google sign-up",
    };
  }
};


export const checkProfileCompleted = async (): Promise<{ success: boolean; isCompleted: boolean; error?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, isCompleted: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check user profile in MongoDB
    const mongoose = await import("@/database/mongoose").then(m => m.connectToDatabase());
    const db = mongoose.connection.db;

    if (!db) {
      return { success: false, isCompleted: false, error: "Database connection not available" };
    }

    // Check if user profile is completed
    const userCollection = db.collection("user");
    const user = await userCollection.findOne({ id: userId });

    const isCompleted = user?.profileCompleted === true;

    return { success: true, isCompleted };
  } catch (e: any) {
    console.error("Failed to check profile completion:", e);
    return { 
      success: false, 
      isCompleted: false,
      error: e.message || "Failed to check profile completion" 
    };
  }
};

export const completeGoogleUserProfile = async ({
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: {
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || "";

    if (!userEmail) {
      return { success: false, error: "User email not found" };
    }

    // Update user profile in MongoDB
    const mongoose = await import("@/database/mongoose").then(m => m.connectToDatabase());
    const db = mongoose.connection.db;

    if (!db) {
      return { success: false, error: "Database connection not available" };
    }

    // Update user document with profile data
    const userCollection = db.collection("user");
    await userCollection.updateOne(
      { id: userId },
      {
        $set: {
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
          profileCompleted: true,
          profileCompletedAt: new Date(),
        },
      },
      { upsert: false }
    );

    // Send welcome email via Inngest
    await inngest.send({
      name: "app/user.created",
      data: {
        email: userEmail,
        name: userName,
        country,
        investmentGoals,
        riskTolerance,
        preferredIndustry,
      },
    });

    return { success: true };
  } catch (e: any) {
    console.error("Failed to complete Google user profile:", e);
    return { 
      success: false, 
      error: e.message || "Failed to complete profile" 
    };
  }
};
