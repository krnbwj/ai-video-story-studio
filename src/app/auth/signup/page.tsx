import Link from "next/link";
import { SignUpForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <SignUpForm />
      <p className="mt-4 text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-violet-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
