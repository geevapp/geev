import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity | Geev",
  description: "View your activity history",
};

export default function ActivityPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Activity</h1>
      <p className="text-muted-foreground">
        Activity history will be implemented here
      </p>
    </div>
  );
}
