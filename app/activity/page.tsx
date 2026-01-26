"use client";
import UserNavbar from "@/components/user-navbar";
import { useSidebar } from "../wallet/components/sidebar-context";
import ActivityMain from "./components/activity-main";
import { MobileSidebarToggle } from "@/components/mobile-sidebar-toggle";

export default function ActivityPage() {
  const { isOpen } = useSidebar();
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
