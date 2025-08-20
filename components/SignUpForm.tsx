"use client"

import { useForm } from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import React, { useState } from "react"
import {Card, CardBody} from "@heroui/card";

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

  const [authError, setAuthError] =  useState<string | null>(null);
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


  const handleVerificationSubmit = async (e: React.
    FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!isLoaded || !signUp) return;
      setIsSubmitting(true);
      setAuthError(null);

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode
        })

        if (result.status === "complete") {
          await setActive({session: result.
            createdSessionId})
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
  <Card className="max-w-md w-full mx-auto mt-20 p-6 shadow-xl">
    <CardBody>
      <h2 className="text-xl font-semibold mb-6 text-center">Verify Your Email</h2>

      {verificationError && (
        <div className="mb-4 text-sm text-red-600">
          {verificationError}
        </div>
      )}

      <form onSubmit={handleVerificationSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Verification Code</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the code sent to your email"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </button>
         <p className="text-sm text-gray-600 mt-4 text-center">
            Didn’t receive the code?{" "}
        <button
          type="button"
          className="text-blue-600 font-medium hover:underline"
          onClick={async () => {
            try {
              await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
              alert("A new code has been sent to your email.");
            } catch (err) {
              console.error("Resend failed:", err);
              alert("Failed to resend the code. Please try again.");
            }
          }}
        >
      Resend Code
    </button>
  </p>
      </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-default-500">
              Didn&apos;t recive a code?{" "}
              <button
              onClick={async () => {
                if (signUp) {
                  await signUp.prepareEmailAddressVerification({
                    strategy: "email_code",
                  });
                }
              }}
              className="text-primary hover:underline font-medium"
              >
                Resend code
              </button>
            </p>
          </div>
    </CardBody>
  </Card>
)
  }

  return (
  <Card className="max-w-md w-full mx-auto mt-20 p-6 shadow-xl">
    <CardBody>
      <h2 className="text-xl font-semibold mb-6 text-center">Create an Account</h2>

      {authError && (
        <div className="mb-4 text-sm text-red-600">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("passwordConfirmation")}
          />
          {errors.passwordConfirmation && (
            <p className="text-xs text-red-600 mt-1">{errors.passwordConfirmation.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </CardBody>
  </Card>



)
}