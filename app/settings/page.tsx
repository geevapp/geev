import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import SettingsBio from "@/components/settings/settings-bio";

export const metadata: Metadata = {
  title: "Settings | Geev",
  description: "Manage your account settings",
};

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsBio />
    </AuthGuard>
  );
}
