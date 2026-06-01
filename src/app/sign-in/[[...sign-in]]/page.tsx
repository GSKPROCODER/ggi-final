import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
