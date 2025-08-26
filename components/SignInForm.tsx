"use client"

import { signInSchema } from "@/schemas/signInSchema"
import { useSignIn } from "@clerk/nextjs"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import Link from "next/link";
import { Alert } from "@heroui/alert";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function SignInForm() {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
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

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card/Box Container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-light">
            Sign in to your account
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
          {/* Email/Username Field */}
          <div className="space-y-2">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email or username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
              </div>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or username"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 text-sm"
                {...register("identifier")}
              />
            </div>
            <p className="text-xs h-4 text-red-600 dark:text-red-400 mt-1">
              {errors.identifier?.message}
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
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-black dark:text-white underline underline-offset-2 decoration-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}