import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
