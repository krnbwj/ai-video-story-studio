import Link from "next/link";
import { SignInForm } from "@/components/auth-form";

export default function SignInPage() {
  const googleEnabled =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <SignInForm googleEnabled={googleEnabled} />
      <p className="mt-4 text-sm text-zinc-400">
        No account?{" "}
        <Link href="/auth/signup" className="text-violet-400 hover:underline">
          Sign up
        </Link>{" "}
        ·{" "}
        <Link href="/auth/forgot-password" className="text-violet-400 hover:underline">
          Forgot password
        </Link>
      </p>
    </div>
  );
}
