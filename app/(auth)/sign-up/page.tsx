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

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-semibold text-white text-center">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-gray-400 mb-14 text-center">
        Welcome! Personalize your experience.
      </p>

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
          {isSubmitting ? "Creating Account" : "Start Your Investing Journey"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>

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
