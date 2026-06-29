import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <CardTitle>Sign-in problem</CardTitle>
        <CardDescription className="mt-4 space-y-2">
          <p>
            Usually this means your email is not verified yet, or{" "}
            <code className="text-violet-300">NEXTAUTH_URL</code> does not match
            the URL in your browser (use <code>127.0.0.1</code>, not{" "}
            <code>localhost</code>).
          </p>
          <p className="text-xs text-zinc-500">
            For local testing, run{" "}
            <code className="text-zinc-400">pnpm run db:seed-user</code> and sign
            in with the printed credentials.
          </p>
        </CardDescription>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Back to sign in</Link>
        </Button>
      </Card>
    </div>
  );
}
