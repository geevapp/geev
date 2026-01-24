import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Geev",
  description: "Connect your wallet to get started",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
