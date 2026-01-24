import { AuthGuard } from "@/components/auth-guard";
import { AuthNavbar } from "@/components/auth-navbar";
import WalletFooter from "./components/footer";
import WalletMain from "./components/wallet-main";
import { MobileSidebarToggle } from "@/components/mobile-sidebar-toggle";

export default function WalletPage() {
  return (
    // <AuthGuard>
    <div className="flex flex-col h-screen w-full">
      <div className="flex items-center gap-3 px-4 lg:px-0">
        <MobileSidebarToggle />
        <div className="flex-1">
          <AuthNavbar />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <WalletMain />
      </div>

      <WalletFooter />
    </div>
    // </AuthGuard>
  );
}
