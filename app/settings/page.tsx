import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Geev",
  description: "Manage your account settings",
};

export default function SettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <p className="text-muted-foreground">
        Settings content will be implemented here
      </p>
    </div>
  );
}
