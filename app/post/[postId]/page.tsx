import type { Metadata } from "next";
import PostDetailClient from "./post-detail-client";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;

  return {
    title: `Post ${postId} | Geev`,
    description: "View full post details on Geev",
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  return <PostDetailClient postId={postId} />;
}
