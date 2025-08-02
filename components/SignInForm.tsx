"use client"

import { signInSchema } from "@/schemas/signInSchema"
import { useSignIn } from "@clerk/nextjs"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {Card, CardBody, CardHeader } from "@heroui/card"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"


export default function SignInForm () {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null)

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
    <Card className="max-w-md mx-auto mt-12">
      <CardHeader>
        <h2 className="text-xl font-semibold text-center">Sign In</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label htmlFor="identifier">Email or Username</label>
            <Input id="identifier" {...register("identifier")} />
            {errors.identifier && (
              <p className="text-red-500 text-sm">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <p className="text-red-600 text-sm">{authError}</p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

        </form>
      </CardBody>
    </Card>
  )
}
