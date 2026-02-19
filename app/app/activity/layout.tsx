import { AuthGuard } from "@/components/auth-guard";
import type { Metadata } from "next";
import SideBar from "../wallet/components/side-bar";
import { SidebarProvider } from "../wallet/components/sidebar-context";
import WalletContent from "../wallet/components/wallet-content";

// METADATA EXPORT: Server Component that handles metadata for activity route
export const metadata: Metadata = {
  title: "Activity | Geev",
  description: "View your activity history",
};

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AuthGuard>
      <SidebarProvider>
        <main className="flex font-inter">
          <SideBar />
          {children}
        </main>
      </SidebarProvider>
    // </AuthGuard>
  );
}
