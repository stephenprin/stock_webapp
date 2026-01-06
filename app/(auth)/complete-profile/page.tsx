"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { completeGoogleUserProfile, getSession, checkProfileCompleted } from "@/lib/actions/auth.actions";
import InputField from "@/components/forms/InputField";

type ProfileFormData = {
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

const CompleteProfile = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      country: "US",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    // Check if user is authenticated and if profile is already completed
    const checkAuthAndProfile = async () => {
      try {
        const session = await getSession();
        if (!session.success || !session.user) {
          // Redirect to sign-in if not authenticated
          router.push("/sign-in");
          return;
        }

        // Check if profile is already completed
        const profileCheck = await checkProfileCompleted();
        if (profileCheck.success && profileCheck.isCompleted) {
          // Profile already completed, redirect to dashboard
          const redirectTo = searchParams.get("redirect") || "/dashboard";
          router.push(redirectTo);
          return;
        }

        // Set user info and allow profile completion
        setUser({
          name: session.user.name || undefined,
          email: session.user.email || undefined,
        });
        setLoading(false);
      } catch (e) {
        console.error("Failed to check session:", e);
        router.push("/sign-in");
      }
    };

    checkAuthAndProfile();
  }, [router, searchParams]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await completeGoogleUserProfile({
        country: data.country,
        investmentGoals: data.investmentGoals,
        riskTolerance: data.riskTolerance,
        preferredIndustry: data.preferredIndustry,
      });

      if (result.success) {
        toast.success("Profile completed successfully!");
        // Redirect to dashboard or the redirect parameter
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        router.push(redirectTo);
      } else {
        toast.error("Failed to complete profile", {
          description: result.error || "Please try again.",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to complete profile", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-12">
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 md:p-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400 text-sm">
            Help us personalize your experience by sharing a few details about your investment preferences.
          </p>
        </div>

        {/* Display user info from Google */}
        {(user?.name || user?.email) && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-xs text-gray-400 mb-2">Signed in as:</p>
            {user.name && (
              <p className="text-white font-medium">{user.name}</p>
            )}
            {user.email && (
              <p className="text-gray-300 text-sm">{user.email}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CountrySelectField
            name="country"
            label="Country"
            control={control}
            error={errors.country}
            required
          />

          <SelectField
            name="investmentGoals"
            label="Investment Goals"
            placeholder="Select your investment goal"
            options={INVESTMENT_GOALS}
            control={control}
            error={errors.investmentGoals}
            required
          />

          <SelectField
            name="riskTolerance"
            label="Risk Tolerance"
            placeholder="Select your risk level"
            options={RISK_TOLERANCE_OPTIONS}
            control={control}
            error={errors.riskTolerance}
            required
          />

          <SelectField
            name="preferredIndustry"
            label="Preferred Industry"
            placeholder="Select your preferred industry"
            options={PREFERRED_INDUSTRIES}
            control={control}
            error={errors.preferredIndustry}
            required
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="green-btn w-full mt-5"
          >
            {isSubmitting ? "Completing Profile..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

