import React from "react";
import SignInForm from "@/components/SignInForm";
import { AuthLayout } from "@/components/AuthLayout";

function SingInPage() {
  return (
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
  )
}

export default SingInPage;