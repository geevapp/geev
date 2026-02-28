"use client";

import type React from "react";
import { useAppContext } from "@/contexts/app-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !user) {
      router.push("/login");
    }
  }, [user, requireAuth, router]);

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}
