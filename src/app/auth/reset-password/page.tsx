import { ResetPasswordForm } from "@/components/auth-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <ResetPasswordForm token={token ?? ""} />
    </div>
  );
}
