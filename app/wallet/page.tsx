import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Wallet | Geev",
  description: "Manage your wallet and tokens",
};

function WalletContent() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>
      <p className="text-muted-foreground">
        Wallet management will be implemented here
      </p>
    </div>
  );
}

function WalletLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-center min-h-100">
        <Spinner size="lg" />
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletLoadingFallback />}>
      <WalletContent />
    </Suspense>
  );
}
