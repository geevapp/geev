"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowLeft,
  Camera,
  Wallet,
  Moon,
  Bell,
  Shield,
  Trash2,
  CreditCard,
} from "lucide-react";

export default function SettingsBio() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    fullName: "Alex Chen",
    username: "alexchen",
    email: "alex@example.com",
    bio: "Crypto enthusiast and community builder. Love helping others succeed! 🚀",
  });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("formData:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleManageWallet = () => {
    console.log("Manage wallet clicked");
  };

  const handleDisconnect = () => {
    console.log("Disconnect wallet clicked");
  };

  const handleDeleteAccount = () => {
    console.log("Delete account clicked");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#101828]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Profile
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-foreground">
              Settings
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Profile Information
            </h2>
            <p className="text-sm text-muted-foreground">
              Update your public profile information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/woman-on-suit.png" alt="Alex Chen" />
                <AvatarFallback className="text-lg">AC</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                className="gap-2 bg-inherit"
              >
                <Camera className="h-4 w-4" />
                Change Avatar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                className="min-h-30"
              />
            </div>

            <div>
              <Button
                type="submit"
                className="px-6 dark:bg-white dark:text-black"
              >
                Save Changes
              </Button>
            </div>
          </form>

          <div className="space-y-6 pt-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Wallet & Payments
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your wallet and payment methods
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-6 rounded-lg shadow-lg bg-white dark:bg-linear-to-r dark:from-[#1C398E] dark:to-[#59168B] dark:border-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg">
                    <Wallet className="h-6 w-6 text-[#155DFC]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Wallet Balance
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      $2500.75 available
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleManageWallet}
                  className="bg-inherit dark:text-black dark:bg-white shrink-0"
                >
                  Manage Wallet
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 p-6 rounded-lg shadow-lg bg-white dark:bg-[#1E2939] dark:border-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Connected Wallet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      0x1234...5678
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="bg-inherit shrink-0"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-border">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize how the app looks and feels
              </p>
            </div>

            <div className="flex items-center justify-between p-6 rounded-lg shadow-lg bg-inherit">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10">
                  <Moon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Dark Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
                className="dark:data-[state=checked]:bg-white"
              />
            </div>
          </div>

          <div className="space-y-6 p-4 bg-inherit">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Notifications
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your notification preferences
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 rounded-lg shadow-lg bg-inherit">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10">
                    <Bell className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  className="dark:data-[state=checked]:bg-white"
                />
              </div>

              <div className="flex items-center justify-between p-6 rounded-lg shadow-lg bg-inherit">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10">
                    <Shield className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified about important updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  className="dark:data-[state=checked]:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 p-4  rounded-2xl bg-destructive/10">
            <div>
              <h2 className="text-xl font-semibold text-destructive mb-1">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground">
                Irreversible and destructive actions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-destructive mb-1">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
