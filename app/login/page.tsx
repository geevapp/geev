"use client";
// REMOVED: metadata export - moved to layout.tsx (Server Component)

import { LoginForm } from "@/components/login-form";
import { GuestNavbar } from "@/components/guest-navbar";

/**
 * Displays the mock authentication form for selecting a test user.
 * No auth checks needed - proxy handles redirects automatically.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <GuestNavbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Geev
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join our community of givers and receivers. Connect, share, and make
            a difference together.
          </p>
        </div>

        <LoginForm />

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧪</span>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Development Mode
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  This is a mock authentication system for testing purposes. In
                  production, this will be replaced with secure wallet-based
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
