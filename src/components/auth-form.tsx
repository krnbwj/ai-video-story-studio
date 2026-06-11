"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or email not verified.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Sign in</CardTitle>
      <CardDescription className="mb-6">
        Access your story projects and provider connections.
      </CardDescription>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Continue with Google
        </Button>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">
          Google sign-in appears when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
        </p>
      )}
    </Card>
  );
}

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Signup failed");
      return;
    }
    setMessage("Check your email (or terminal in dev mode) to verify your account.");
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Create account</CardTitle>
      <CardDescription className="mb-6">
        Start building AI stories with free providers.
      </CardDescription>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {message ? <p className="text-sm text-violet-300">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMessage("If that email exists, a reset link was sent (check terminal in dev mode).");
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Forgot password</CardTitle>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {message ? <p className="text-sm text-violet-300">{message}</p> : null}
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
    </Card>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setMessage(res.ok ? "Password updated. You can sign in now." : "Reset failed.");
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Reset password</CardTitle>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {message ? <p className="text-sm text-violet-300">{message}</p> : null}
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </Card>
  );
}
