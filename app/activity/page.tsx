import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Activity | Geev",
  description: "View your activity history",
};

function ActivityContent() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Activity</h1>
      <p className="text-muted-foreground">
        Activity history will be implemented here
      </p>
    </div>
  );
}

function ActivityLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-center min-h-100">
        <Spinner size="lg" />
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<ActivityLoadingFallback />}>
      <ActivityContent />
    </Suspense>
  );
}
