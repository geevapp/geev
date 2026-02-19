import type { Metadata } from 'next'

// METADATA EXPORT: Server Component that handles metadata for feed route
export const metadata: Metadata = {
  title: 'Feed | Geev',
  description: 'Browse giveaways and help requests',
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
