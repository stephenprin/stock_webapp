"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOTP, resendOTP } from "@/lib/actions/otp.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/lib/actions/auth.actions";

interface OTPVerificationModalProps {
  open: boolean;
  email: string;
  name: string;
  password: string;
  userProfileData?: {
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
  } | null;
  onVerified: () => void;
}

export default function OTPVerificationModal({
  open,
  email,
  name,
  password,
  userProfileData,
  onVerified,
}: OTPVerificationModalProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!open || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeLeft]);

  // Reset timer when modal opens
  useEffect(() => {
    if (open) {
      setTimeLeft(600);
      setOtp(["", "", "", "", "", ""]);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d+$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }

    setOtp(newOtp);
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOTP({
        email,
        code: otpCode,
        userData: userProfileData
          ? {
              fullName: name,
              ...userProfileData,
            }
          : undefined,
      });

      if (result.success) {
        toast.success("Email verified successfully!");
        
        // Sign in the user after OTP verification
        try {
          const signInResult = await signInWithEmail({
            email,
            password,
          });

          if (signInResult.success) {
            onVerified();
            router.push("/dashboard");
          } else {
            toast.error("Email verified but sign-in failed. Please sign in manually.");
            router.push("/sign-in");
          }
        } catch (error) {
          toast.error("Email verified but sign-in failed. Please sign in manually.");
          router.push("/sign-in");
        }
      } else {
        // Show specific error message
        const errorMessage = result.error || "Invalid OTP code";
        toast.error(errorMessage);
        
        // If rate limited, show additional info
        if (result.rateLimitInfo) {
          if (result.rateLimitInfo.lockedUntil) {
            const minutesLeft = Math.ceil(
              (new Date(result.rateLimitInfo.lockedUntil).getTime() -
                Date.now()) /
                (60 * 1000)
            );
            toast.info(
              `Please wait ${minutesLeft} minute(s) before trying again.`,
              { duration: 5000 }
            );
          } else if (result.rateLimitInfo.remainingAttempts !== undefined) {
            toast.info(
              `Remaining attempts: ${result.rateLimitInfo.remainingAttempts}`,
              { duration: 3000 }
            );
          }
        }
        
        // Clear inputs on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await resendOTP({ email, name });
      if (result.success) {
        toast.success("New OTP code sent to your email!");
        if (result.rateLimitInfo?.remainingAttempts !== undefined) {
          toast.info(
            `Remaining resends: ${result.rateLimitInfo.remainingAttempts}`,
            { duration: 3000 }
          );
        }
        setTimeLeft(600);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const errorMessage = result.error || "Failed to resend OTP";
        toast.error(errorMessage);
        
        // Show rate limit info if available
        if (result.rateLimitInfo) {
          if (result.rateLimitInfo.lockedUntil) {
            const minutesLeft = Math.ceil(
              (new Date(result.rateLimitInfo.lockedUntil).getTime() -
                Date.now()) /
                (60 * 1000)
            );
            toast.info(
              `You can request a new code in ${minutesLeft} minute(s).`,
              { duration: 5000 }
            );
          }
        }
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-center">
            We've sent a 6-digit verification code to{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input Fields */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold"
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Timer */}
          {timeLeft > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Code expires in {formatTime(timeLeft)}
            </p>
          ) : (
            <p className="text-center text-sm text-destructive">
              Code expired. Please request a new one.
            </p>
          )}

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={otp.join("").length !== 6 || isVerifying || timeLeft === 0}
            className="w-full green-btn"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>

          {/* Resend Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending || timeLeft > 0}
              className="text-sm"
            >
              {isResending
                ? "Sending..."
                : timeLeft > 0
                ? `Resend code in ${formatTime(timeLeft)}`
                : "Resend Verification Code"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

