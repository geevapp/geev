import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Settings | Geev",
  description: "Manage your account settings",
};

function SettingsContent() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <p className="text-muted-foreground">
        Settings content will be implemented here
      </p>
    </div>
  );
}

function SettingsLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingFallback />}>
      <SettingsContent />
    </Suspense>
  );
}
