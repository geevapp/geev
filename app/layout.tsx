import "./globals.css";

import { AppLayout } from "@/components/app-layout";
import { AppProvider } from "@/contexts/app-context";
import type { Metadata } from "next";
import type React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Geev - Community Giveaways & Help Platform",
  description: "Giving Made Global",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AppProvider>
              <AppLayout>{children}</AppLayout>
              <Toaster />
            </AppProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
