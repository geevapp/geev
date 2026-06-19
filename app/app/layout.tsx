import './globals.css';

import { AppLayout } from '@/components/app-layout';
import { AppProvider } from '@/contexts/app-context';
import type { Metadata } from 'next';
import type React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Geev - Community Giveaways & Help Platform',
  description: 'Giving Made Global',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value;

  return (
    <html lang="en" className={theme} suppressHydrationWarning style={{ colorScheme: theme }}>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme={theme}
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
