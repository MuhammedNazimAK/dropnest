"use client"

import { signInSchema } from "@/schemas/signInSchema"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link"

interface SignInFormProps {
  onClose?: () => void;
  isModal?: boolean;
  setShowModal?: Dispatch<SetStateAction<ModalState>>;
}

type ModalState = {
  type: 'signin' | 'signup' | null;
  isOpen: boolean;
};

export default function SignInForm({ onClose, isModal = false, setShowModal }: SignInFormProps) {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded) return
    setIsSubmitting(true)
    setAuthError(null)

    try {
      const result = await signIn.create({
        identifier: data.identifier,
        password: data.password
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        // Close modal if it exists before navigating
        if (onClose) {
          onClose();
        }
        router.push("/dashboard")
      } else {
        setAuthError("Sign in error")
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        setAuthError(error.message || "An error occurred during the signin. Please try again.")
      } else {
        setAuthError("An unknown error occurred.")
      }

    } finally {
      setIsSubmitting(false)
    }
  }

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || "email_not_set";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD || "password_not_set";

  useEffect(() => {
    const handleFillDemo = () => {
      setValue("identifier", demoEmail);
      setValue("password", demoPassword);
    };

    window.addEventListener('fillDemo', handleFillDemo);
    return () => window.removeEventListener('fillDemo', handleFillDemo);
  }, [setValue]);

  return (
    <div className={isModal ? "w-[400px] mx-auto" : "w-full max-w-sm mx-auto"}>
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
            {isModal ? 'Sign In' : 'Welcome back'}
          </h1>
          <p className="text-gray-500 font-light text-sm">
            {isModal ? 'Access your account or try the demo' : 'Sign in to your account'}
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
          {/* Email/Username Field */}
          <div className="space-y-2">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
              Email or username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200" />
              </div>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or username"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
                {...register("identifier")}
              />
            </div>
            <p className="text-xs h-4 text-red-600 mt-1">
              {errors.identifier?.message}
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
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer */}
        {!isModal && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-black underline underline-offset-2 decoration-1"
              >
                Sign up
              </Link>
            </p>
          </div>
        )}

        {/* Modal Footer */}
        {isModal && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need a fresh account?{" "}
              <button
                type="button"
                onClick={() => setShowModal?.({ type: 'signup', isOpen: true })}
                className="font-medium text-blue-600 underline underline-offset-2 decoration-1"
              >
                Create account instead
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}