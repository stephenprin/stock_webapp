"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import Link from "next/link";

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);
      if (result.success) {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Sign in failed", {
          description: result.error || "Invalid credentials. Please try again.",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed", {
        description: e instanceof Error ? e.message : "Failed to sign in.",
      });
    }
  };

  const handleGoogleSignIn = () => {
    toast.info("Google sign-in coming soon");
  };

  const handleAppleSignIn = () => {
    toast.info("Apple sign-in coming soon");
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 md:p-10">
        <h1 className="text-3xl font-bold text-white mb-8">Sign In</h1>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
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
            onClick={handleAppleSignIn}
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
            <span className="px-4 bg-gray-800 text-gray-400">or</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-300 mb-2 block">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@email.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="h-12 bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-300 mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              className="h-12 bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-green-500 hover:bg-green-600 text-gray-900 font-medium rounded-lg text-base"
          >
            {isSubmitting ? "Signing In..." : "Continue"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-green-500 hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
