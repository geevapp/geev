"use client";

import {
  Copy,
  Key,
  LogOut,
  Mail,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  requestAccess,
  isConnected,
  getAddress,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";


/**
 * Wallet-based login and registration form
 */
export function WalletLoginForm({
  authType = "login",
}: {
  authType?: "login" | "register";
}) {
  const router = useRouter();
  // Simple toast simulation
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    return toast[type](message);
  };
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const { isConnected: freighterIsConnected } = await isConnected();
      if (!freighterIsConnected) {
        showToast("Freighter wallet is not installed or not connected", "error");
        return;
      }

      await requestAccess();
      const publicKey = await getAddress();
      if (publicKey) {
        setWalletAddress(publicKey.address);
        setIsWalletConnected(true);
        showToast("Wallet connected successfully!", "success");
      } else {
        showToast("Could not retrieve wallet address.", "error");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      showToast("Failed to connect wallet. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (mode: "login" | "register") => {
    if (mode === "register" && !username) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch challenge
      const challengeResponse = await fetch(
        `/api/auth/challenge?publicKey=${encodeURIComponent(walletAddress)}`,
        { cache: "no-store" },
      );
      const challengeData = await challengeResponse.json();
      if (!challengeResponse.ok) {
        throw new Error(challengeData?.message || "Failed to fetch challenge");
      }

      // 2. Sign challenge
      const signedResult = await freighterSignTransaction(
        challengeData.transaction,
        {
          networkPassphrase: challengeData.network_passphrase,
        },
      );

      if (signedResult.error) {
        throw new Error(signedResult.error);
      }

      if (!signedResult.signedTxXdr) {
        throw new Error("Freighter did not return a signed transaction.");
      }

      // 3. Authenticate with NextAuth
      const result = await signIn("credentials", {
        walletAddress,
        transaction: signedResult.signedTxXdr,
        username: mode === "register" ? username : undefined,
        email: mode === "register" ? email || undefined : undefined,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        showToast(
          mode === "login"
            ? "Successfully logged in!"
            : "Account created successfully!",
          "success",
        );
        router.push("/feed");
        return;
      }

      showToast(
        result?.error ||
          (mode === "login" ? "Login failed" : "Registration failed"),
        "error",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      showToast(errorMessage, "error");
      // Also log the full error for debugging
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });

      showToast("Successfully logged out!", "success");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Logout failed", "error");
    }
  };

  // If user is already logged in
  if (status === "authenticated" || session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Already Logged In
          </CardTitle>
          <CardDescription className="text-center">
            You are currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.push("/feed")} className="w-full cursor-pointer">
            Go to Feed
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full mx-auto">
      {!isWalletConnected ? (
        <Button
          onClick={handleConnectWallet}
          disabled={isLoading}
          className="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white cursor-pointer"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isLoading ? "Connecting..." : "Connect Freighter Wallet"}
        </Button>
      ) : (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <div className="flex items-center gap-2 p-3 rounded-md border bg-gray-50 dark:bg-gray-800">
              <Wallet className="h-4 w-4 text-gray-500" />
              <span className="font-mono text-sm truncate flex-1">
                {walletAddress}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  showToast("Address copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {authType === "register" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => authenticate(authType)}
              disabled={isLoading}
              className="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white cursor-pointer"
            >
              <Key className="w-4 h-4 mr-2" />
              {isLoading
                ? "Waiting for signature..."
                : authType === "login"
                  ? "Login with Wallet"
                  : "Create Account with Wallet"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground cursor-pointer"
              onClick={() => {
                setIsWalletConnected(false);
                setWalletAddress("");
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Use a different wallet
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
        <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
          <strong>How it works:</strong> You will
          be prompted by your Freighter wallet to sign a secure, one-time
          challenge. This proves you own the wallet without revealing your keys.
        </p>
      </div>
    </div>
  );
}
