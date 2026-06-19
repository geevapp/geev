"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Key, Mail, User, Wallet } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  isConnected,
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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [challengeXdr, setChallengeXdr] = useState("");
  const [networkPassphrase, setNetworkPassphrase] = useState("");
  const [signedTransaction, setSignedTransaction] = useState("");

  const fetchChallenge = async () => {
    if (!walletAddress) {
      showToast("Please enter your wallet address first", "error");
      return null;
    }

    try {
      const response = await fetch(
        `/api/auth/challenge?publicKey=${encodeURIComponent(walletAddress)}`,
        { cache: "no-store" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch challenge");
      }

      setChallengeXdr(data.transaction);
      setNetworkPassphrase(data.network_passphrase);
      return data as { transaction: string; network_passphrase: string };
    } catch (error) {
      console.error("Challenge error:", error);
      showToast("Could not generate a secure challenge. Please try again.", "error");
      return null;
    }
  };

  const handleSignChallenge = async () => {
    if (!walletAddress) {
      showToast("Please enter your wallet address first", "error");
      return;
    }

    try {
      const connected = await isConnected();
      if (!connected) {
        showToast("Freighter wallet is not installed or not connected", "error");
        return;
      }

      const defaultPassphrase =
        process.env.NEXT_PUBLIC_STELLAR_NETWORK === "testnet"
          ? "Test Stellar Public Network ; September 2015"
          : "Public Global Stellar Network ; September 2015";

      const challenge = challengeXdr
        ? {
            transaction: challengeXdr,
            network_passphrase: networkPassphrase || defaultPassphrase,
          }
        : await fetchChallenge();

      if (!challenge) {
        return;
      }

      const signedResult = await (freighterSignTransaction as any)(
        challenge.transaction,
        {
          networkPassphrase: challenge.network_passphrase,
        },
      );

      const signedXdr =
        typeof signedResult === "string"
          ? signedResult
          : signedResult?.signedTxXdr ||
            signedResult?.signedTransaction ||
            signedResult?.txXdr ||
            null;

      if (!signedXdr) {
        throw new Error("Freighter did not return a signed transaction");
      }

      setSignedTransaction(signedXdr);
      showToast("Challenge signed successfully", "success");
    } catch (error) {
      console.error("Signing error:", error);
      showToast("Error signing the challenge", "error");
    }
  };

  const authenticate = async (mode: "login" | "register") => {
    if (!walletAddress || !signedTransaction) {
      showToast("Please sign the wallet challenge first", "error");
      return;
    }

    if (mode === "register" && !username) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        walletAddress,
        transaction: signedTransaction,
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
      console.error("Authentication error:", error);
      showToast(
        mode === "login"
          ? "Login failed. Please try again."
          : "Registration failed. Please try again.",
        "error",
      );
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
          <Button onClick={() => router.push("/feed")} className="w-full">
            Go to Feed
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full mx-auto">
      {authType === "login" && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="G..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Signed Challenge</label>
            <div className="flex gap-2">
              <Input
                placeholder="Signed transaction from Freighter"
                value={signedTransaction}
                onChange={(e) => setSignedTransaction(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSignChallenge}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Challenge Transaction</label>
            <div className="relative">
              <textarea
                value={challengeXdr}
                onChange={(e) => setChallengeXdr(e.target.value)}
                className="flex min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-0"
                placeholder="Server-issued challenge transaction..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => fetchChallenge()}
              >
                Fetch
              </Button>
            </div>
          </div>

          <Button
            onClick={() => authenticate("login")}
            disabled={isLoading}
            className="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      )}

      {authType === "register" && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="G..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium">Signed Challenge</label>
            <div className="flex gap-2">
              <Input
                placeholder="Signed transaction from Freighter"
                value={signedTransaction}
                onChange={(e) => setSignedTransaction(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSignChallenge}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Challenge Transaction</label>
            <div className="relative">
              <textarea
                value={challengeXdr}
                onChange={(e) => setChallengeXdr(e.target.value)}
                className="flex min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Server-issued challenge transaction..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => fetchChallenge()}
              >
                Fetch
              </Button>
            </div>
          </div>

          <Button
            onClick={() => authenticate("register")}
            disabled={isLoading}
            className="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </div>
      )}

      <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
        <p className="text-sm text-orange-700 dark:text-orange-300">
          <strong>Note:</strong> Wallet auth now uses a signed Stellar
          challenge transaction before a session is issued.
        </p>
      </div>
    </div>
  );
}
