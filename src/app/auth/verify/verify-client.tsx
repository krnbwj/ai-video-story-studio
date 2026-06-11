"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function VerifyClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setMessage("Invalid verification link.");
      return;
    }
    fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setMessage(
          data.ok
            ? "Email verified! You can sign in now."
            : (data.error ?? "Verification failed."),
        );
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="max-w-md text-center">
        <CardTitle>Email verification</CardTitle>
        <CardDescription className="mt-4">{message}</CardDescription>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Go to sign in</Link>
        </Button>
      </Card>
    </div>
  );
}
