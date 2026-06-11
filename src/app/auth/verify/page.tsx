import { Suspense } from "react";
import { VerifyClient } from "./verify-client";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Verifying...</div>}>
      <VerifyClient />
    </Suspense>
  );
}
