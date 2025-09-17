"use client"

import { useForm } from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import React, { Dispatch, SetStateAction, useState } from "react"
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner"

//zod custom schema
import { signUpSchema } from "@/schemas/signUpSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod";

interface SignUpFormProps {
  isModal?: boolean;
  onClose?: () => void;
  setShowModal?: Dispatch<SetStateAction<ModalState>>;
}

type ModalState = {
  type: 'signin' | 'signup' | null;
  isOpen: boolean;
};

export default function SignUpForm({ isModal = false, setShowModal, onClose }: SignUpFormProps) {
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
          error.message || "An error occurred during signup. Please try again"
        )
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return;
    setIsSubmitting(true);
    setVerificationError(null);

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
        setVerificationError("Verification could not be completed")
      }
    } catch (error: unknown) {
      if (error instanceof Error)
        setVerificationError(
          error.message || "An error occurred during verification. Please try again"
        )
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className={isModal ? "w-full max-w-xs mx-auto" : "w-full max-w-sm mx-auto"}>
        <div className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm ${isModal ? 'p-6' : 'p-8'}`}>

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header Section */}
          <div className="text-center mb-6">
            <h1 className={`font-light text-gray-900 mb-2 tracking-tight ${isModal ? 'text-2xl' : 'text-3xl'}`}>
              Verify Your Email
            </h1>
            <p className="text-gray-500 font-light text-sm">
              Enter the code sent to your email address
            </p>
          </div>

          {/* Error Alert */}
          {verificationError && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50">
              <p className="text-sm text-red-600">{verificationError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            {/* Verification Code Field */}
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200" />
                </div>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm text-center tracking-[0.2em]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm ${isModal
                ? 'bg-gradient-to-r from-blue-500 to-gray-700 text-white focus:ring-blue-500'
                : 'bg-black text-white focus:ring-black'
                }`}
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
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                className="font-medium text-black underline underline-offset-2 decoration-1"
                onClick={async () => {
                  try {
                    await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
                    toast.success("A new code has been sent.");
                  } catch (err) {
                    console.warn(err)
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
    <div className={isModal ? "w-[400px] mx-auto" : "max-w-sm mx-auto"}>
      {/* Card/Box Container */}
      <div className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm ${isModal ? 'p-6' : 'p-8'}`}>

        {isModal && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className={`font-light text-gray-900 mb-2 tracking-tight ${isModal ? 'text-2xl' : 'text-3xl'}`}>
            {isModal ? 'Create Account' : 'Create Your Account'}
          </h1>
          <p className="text-gray-500 font-light text-sm">
            {isModal ? 'Join to access all features' : 'Get started with your secure cloud storage'}
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
                {...register("email")}
              />
            </div>
            <p className="text-xs h-4 text-red-600 mt-1">
              {errors.email?.message}
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
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
            <p className="text-xs h-4 text-red-600 mt-1">
              {errors.password?.message}
            </p>
          </div>

          {/* Password Confirmation Field */}
          <div className="space-y-2">
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200" />
              </div>
              <input
                id="passwordConfirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="Confirm your password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
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
            <p className="text-xs h-4 text-red-600 mt-1">
              {errors.passwordConfirmation?.message}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm ${isModal
              ? 'bg-gradient-to-r from-blue-500 to-gray-700 text-white focus:ring-blue-500'
              : 'bg-black text-white focus:ring-black'
              }`}
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
              isModal ? "Create Account" : "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        {!isModal && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-black underline underline-offset-2 decoration-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Modal Footer */}
        {isModal && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setShowModal?.({ type: 'signin', isOpen: true })}
                className="font-medium text-blue-600 underline underline-offset-2 decoration-1"
              >
                Sign in instead
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}