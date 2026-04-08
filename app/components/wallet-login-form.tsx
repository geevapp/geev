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
import { isConnected, signMessage as freighterSignMessage } from "@stellar/freighter-api";

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
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState("");

  // Generate actual signature using Freighter
  const handleSignMessage = async () => {
    if (!walletAddress) {
      showToast("Please enter your wallet address first", "error");
      return;
    }

    try {
      // Check if Freighter is available
      const connected = await isConnected();
      if (!connected) {
        showToast("Freighter wallet is not installed or not connected", "error");
        return;
      }

      const msg = message || await generateSignMessage();
      
      let signedMsg;
      try {
        signedMsg = await freighterSignMessage(msg, {
          networkPassphrase: "Test SDF Network ; September 2015" // fallback or configurable
        });
      } catch (err) {
        // Fallback for cases where it doesn't take options or simple reject
        signedMsg = await freighterSignMessage(msg);
      }

      if (signedMsg) {
        if (typeof signedMsg === "string") {
          setSignature(signedMsg);
        } else if (typeof signedMsg === "object" && typeof (signedMsg as any).signature === "string") {
          setSignature((signedMsg as any).signature);
        } else {
          setSignature(signedMsg.toString());
        }
        showToast("Message signed successfully", "success");
      }
    } catch (error) {
      console.error("Signing error:", error);
      showToast("Error signing the message", "error");
    }
  };

  // Fetch a server-issued nonce
  const generateSignMessage = async () => {
    if (!walletAddress) {
      showToast("Please enter your wallet address first", "error");
      return;
    }

    try {
      const response = await fetch("/api/auth/nonce");
      if (!response.ok) throw new Error("Failed to fetch nonce");
      
      const { nonce } = await response.json();
      const msg = `Sign this message to authenticate with Geev\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
      setMessage(msg);
      return msg;
    } catch (error) {
      console.error("Error generating nonce:", error);
      showToast("Could not generate a secure nonce. Please try again.", "error");
    }
  };


  const handleLogin = async () => {
    if (!walletAddress || !signature || !message) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        walletAddress,
        signature,
        message,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        showToast("Successfully logged in!", "success");
        router.push("/feed");
        return;
      }

      showToast(result?.error || "Login failed", "error");
    } catch (error) {
      console.error("Login error:", error);
      showToast("Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress || !username || !signature || !message) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        walletAddress,
        signature,
        message,
        username,
        email: email || undefined,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        showToast("Account created successfully!", "success");
        router.push("/feed");
      } else {
        showToast(result?.error || "Registration failed", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast("Registration failed. Please try again.", "error");
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
            <label className="text-sm font-medium">Signature</label>
            <div className="flex gap-2">
              <Input
                placeholder="Signature from wallet"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSignMessage}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message to Sign</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-0"
                placeholder="Message to sign..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => generateSignMessage()}
              >
                Generate
              </Button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
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
            <label className="text-sm font-medium">Signature</label>
            <div className="flex gap-2">
              <Input
                placeholder="Signature from wallet"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSignMessage}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message to Sign</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Message to sign..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => generateSignMessage()}
              >
                Generate
              </Button>
            </div>
          </div>

          <Button
            onClick={handleRegister}
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
          <strong>Note:</strong> This is a demo implementation. In production,
          you would integrate with actual wallet providers like MetaMask or
          WalletConnect.
        </p>
      </div>
    </div>
  );
}
