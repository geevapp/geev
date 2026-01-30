"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "../app/wallet/components/sidebar-context";

export function MobileSidebarToggle() {
  const { setIsOpen } = useSidebar();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Open sidebar"
    >
      <Menu size={20} />
    </button>
  );
}
