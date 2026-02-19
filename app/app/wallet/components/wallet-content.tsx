"use client";

import { useSidebar } from "./sidebar-context";

export default function WalletContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <div
      className={`flex-1 transition-all duration-300 lg:${isOpen ? "ml-64" : "ml-16"}`}
    >
      {children}
    </div>
  );
}
