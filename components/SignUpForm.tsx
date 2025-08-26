"use client"

import { useForm } from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import React, { useState } from "react"
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner"

//zod custom schema
import { signUpSchema } from "@/schemas/signUpSchema"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod";


export default function SignUpForm() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const { signUp, isLoaded, setActive } = useSignUp();

  const {
    register,
    handleSubmit,
    formState: { errors },

  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setAuthError(null);

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password
      })
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code"
      })
      setVerifying(true);
    } catch (error: unknown) {
      if (error instanceof Error)
        setAuthError(
          error.message || "An error occured during the signup. please try again"
        )
    } finally {
      setIsSubmitting(false)
    }
  };


  const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return;
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode
      })

      if (result.status === "complete") {
        await setActive({
          session: result.createdSessionId
        })
        router.push("/dashboard")
      } else {
        console.error("Verification incomplete", result);
        setVerificationError(
          "verification could not be complete"
        )
      }

    } catch (error: unknown) {
      if (error instanceof Error)
        setVerificationError(
          error.message || "An error occured during the signup. please try again"
        )
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="w-full max-w-sm mx-auto">
        {/* Card/Box Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-light">
              Enter the code sent to your email address
            </p>
          </div>

          {/* Error Alert */}
          {verificationError && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">{verificationError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerificationSubmit} className="space-y-3">
            {/* Verification Code Field */}
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
                </div>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-sm text-center tracking-[0.2em]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white text-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="font-medium text-black dark:text-white underline underline-offset-2 decoration-1 disabled:opacity-50"
                onClick={async () => {
                  try {
                    await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
                    toast.success("A new code has been sent.");
                  } catch (err) {
                    toast.error("Failed to resend code. Please try again.");
                  }
                }}
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card/Box Container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-light">
            Get started with your secure cloud storage
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-sm"
                {...register("email")}
              />
            </div>
            <p className="text-xs h-4 text-red-600 dark:text-red-400 mt-1">
              {errors.email?.message}
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-sm"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs h-4 text-red-600 dark:text-red-400 mt-1">
              {errors.password?.message}
            </p>
          </div>

          {/* Password Confirmation Field */}
          <div className="space-y-2">
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
              </div>
              <input
                id="passwordConfirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="Confirm your password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-sm"
                {...register("passwordConfirmation")}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
              >
                {showPasswordConfirmation ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs h-4 text-red-600 dark:text-red-400 mt-1">
              {errors.passwordConfirmation?.message}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white text-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-black dark:text-white underline underline-offset-2 decoration-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}