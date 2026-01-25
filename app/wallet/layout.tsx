import type { Metadata } from "next";
import SideBar from "./components/side-bar";
import { SidebarProvider } from "./components/sidebar-context";
import WalletContent from "./components/wallet-content";

export const metadata: Metadata = {
  title: "Wallet | Geev",
  description: "Manage your wallet and tokens",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <main className="flex font-inter">
        <SideBar />
        <WalletContent>{children}</WalletContent>
      </main>
    </SidebarProvider>
  );
}
