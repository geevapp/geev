import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Feed | Geev',
  description: 'Browse giveaways and help requests',
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
