import { AdminModerationDashboard } from "@/components/admin-moderation-dashboard";
import { getCurrentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminModerationPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/feed");
  }

  return <AdminModerationDashboard />;
}
