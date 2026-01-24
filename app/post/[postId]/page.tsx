import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;
  return {
    title: `Post ${postId} | Geev`,
    description: "View post details",
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Post Detail</h1>
      <p className="text-muted-foreground mb-4">Post ID: {postId}</p>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Post content will be implemented here
        </p>
      </div>
    </div>
  );
}
