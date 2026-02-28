"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { WalletLoginForm } from "@/components/wallet-login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img
              src="/logo-light.png"
              alt="Geev"
              className="h-10 dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="Geev"
              className="h-10 hidden dark:block"
            />
            {/* <span className="font-bold text-lg text-gray-900 dark:text-white">Geev</span> */}
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to continue
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Connect your wallet to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletLoginForm authType="login" />

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
              </span>
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
