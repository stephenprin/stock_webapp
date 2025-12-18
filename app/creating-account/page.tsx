"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

export default function CreatingAccountPage() {
  const router = useRouter();

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    let minLoadTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const run = async () => {
      // Ensure we always show the "polling" page for ~10s before routing on success.
      const minLoadDone = new Promise<void>((resolve) => {
        minLoadTimer = setTimeout(() => resolve(), 10000);
      });

      const raw = sessionStorage.getItem("pendingSignUp");
      if (!raw) {
        router.replace("/sign-up");
        return;
      }

      let payload: SignUpFormData | null = null;
      try {
        payload = JSON.parse(raw) as SignUpFormData;
      } catch {
        sessionStorage.removeItem("pendingSignUp");
        router.replace("/sign-up");
        return;
      }

      const result = await signUpWithEmail(payload);
      if (cancelled) return;

      if (result.success) {
        sessionStorage.removeItem("pendingSignUp");
        await minLoadDone;
        if (cancelled) return;
        toast.success("Account created successfully!");
        router.replace("/");
      } else {
        sessionStorage.removeItem("pendingSignUp");
        toast.error("Sign up failed", {
          description:
            result.error || "Failed to create an account. Please try again.",
        });
        redirectTimer = setTimeout(() => {
          router.replace("/sign-up");
        }, 5000);
      }
    };

    run().catch((e) => {
      console.error(e);
      sessionStorage.removeItem("pendingSignUp");
      toast.error("Sign up failed", {
        description: e instanceof Error ? e.message : "Failed to create an account.",
      });
      redirectTimer = setTimeout(() => {
        router.replace("/sign-up");
      }, 5000);
    });

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
      if (minLoadTimer) clearTimeout(minLoadTimer);
    };
  }, [router]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4">
      <Image
        src="/assets/images/logo.png"
        alt="Loading animation"
        width={160}
        height={160}
        className="w-40 h-40 mb-6"
        priority
      />

      <h1 className="text-2xl font-semibold text-white">
        Creating your account...
      </h1>

      <p className="text-gray-400 mt-3 max-w-sm">
        Please wait patiently while we set up your personalized investing
        experience.
      </p>
    </div>
  );
}
