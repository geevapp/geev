"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";

export function GuestBanner() {
    const { user, isHydrated } = useAppContext();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if hydrated and no user
        if (isHydrated && !user) {
            // Check session storage
            const dismissed = sessionStorage.getItem("guest_banner_dismissed");
            if (!dismissed) {
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [user, isHydrated]);

    const handleDismiss = () => {
        sessionStorage.setItem("guest_banner_dismissed", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="sticky top-0 z-[100] w-full bg-orange-600 text-white px-4 py-3 shadow-md">
            <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
                <div className="flex-1 text-sm font-medium">
                    Welcome to Geev! Sign in to join the community, create posts, and track your impact.
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className={cn(
                            buttonVariants({ variant: "secondary", size: "sm" }),
                            "whitespace-nowrap bg-white text-orange-600 hover:bg-orange-50 border-none h-8"
                        )}
                    >
                        Sign In
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-orange-700/50 hover:text-white"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
