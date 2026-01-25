import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profile ${userId} | Geev`,
    description: "View user profile",
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <p className="text-muted-foreground mb-4">User ID: {userId}</p>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Profile content will be implemented here
        </p>
      </div>
    </div>
  );
}
