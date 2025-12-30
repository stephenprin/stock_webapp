"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import OTPVerificationModal from "@/components/OTPVerificationModal";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/actions/auth.actions";

const SignUp = () => {
  const router = useRouter();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userProfileData, setUserProfileData] = useState<{
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "US",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if (result.success) {
        if (result.requiresOTP && result.otpSent) {
          setUserEmail(data.email);
          setUserName(data.fullName);
          setUserPassword(data.password);
          setUserProfileData({
            country: data.country,
            investmentGoals: data.investmentGoals,
            riskTolerance: data.riskTolerance,
            preferredIndustry: data.preferredIndustry,
          });
          setShowOTPModal(true);
        } else if (!result.requiresOTP) {
          router.push("/");
        } else {
          toast.error(result.error || "Failed to send OTP");
        }
      } else {
        toast.error(result.error || "Sign up failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Sign up failed", {
        description:
          e instanceof Error ? e.message : "Failed to create an account.",
      });
    }
  };

  const handleOTPVerified = () => {
    setShowOTPModal(false);
  };

  const handleGoogleSignUp = () => {
    toast.info("Google sign-up coming soon");
  };

  const handleAppleSignUp = () => {
    toast.info("Apple sign-up coming soon");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 md:p-10">
        <h1 className="text-3xl font-bold text-white mb-8">Sign Up</h1>

      {/* Social Login Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          onClick={handleGoogleSignUp}
          variant="outline"
          className="w-full h-12 bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
        
        <Button
          type="button"
          onClick={handleAppleSignUp}
          variant="outline"
          className="w-full h-12 bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </Button>
      </div>

      {/* Separator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-900 text-gray-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          name="fullName"
          label="Full Name"
          placeholder="Mat Prince"
          register={register}
          error={errors.fullName}
          validation={{ required: "Full name is required", minLength: 2 }}
        />

        <InputField
          name="email"
          label="Email"
          placeholder="contact@princeng.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email name is required",
            pattern: /^\w+@\w+\.\w+$/,
            message: "Email address is required",
          }}
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter a strong password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
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
          {isSubmitting ? "Creating Account" : "Start Your Investing Journey"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
      </div>

      <OTPVerificationModal
        open={showOTPModal}
        email={userEmail}
        name={userName}
        password={userPassword}
        userProfileData={userProfileData}
        onVerified={handleOTPVerified}
      />
    </div>
  );
};
export default SignUp;
