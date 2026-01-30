import type { Metadata } from 'next'

// METADATA EXPORT: Server Component that handles metadata for login route
export const metadata: Metadata = {
  title: 'Login | Geev',
  description: 'Connect your wallet to get started',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
