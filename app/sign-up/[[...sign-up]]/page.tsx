import React from "react";
import SignUpForm from "@/components/SignUpForm";
import { AuthLayout } from "@/components/AuthLayout";

function SingUpPage() {
  return (
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
  )
}

export default SingUpPage;