import React from "react";
import { AuthLayout } from "@/components/AuthLayout";
import SignInForm from "@/components/SignInForm";

function SingInPage() {
  return (
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
  )
}

export default SingInPage;