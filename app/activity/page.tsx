import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@/components/ui/spinner";
import { MobileSidebarToggle } from "@/components/mobile-sidebar-toggle";
import UserNavbar from "@/components/user-navbar";
import ActivityMain from "@/app/activity/components/activity-main";

export const metadata: Metadata = {
  title: "Activity | Geev",
  description: "View your activity history",
};

function ActivityContent() {
  const isOpen = true; // Default value
  
  return (
    <div className={`w-full h-screen flex flex-col ${isOpen ? "lg:ml-64" : "lg:ml-16"}`}>
      <MobileSidebarToggle />
      <UserNavbar />
      <div className="flex-1 overflow-y-auto">
        <ActivityMain />
      </div>
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
