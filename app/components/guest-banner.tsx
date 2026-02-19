"use client";

import { useEffect, useState } from "react";
import { X, Gift, ArrowRight } from "lucide-react";
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
        <div className="w-full px-4 sm:px-6 pt-4 pb-2">
            {/* Outer glow wrapper */}
            <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-orange-400/60 via-orange-500/40 to-orange-400/60 shadow-[0_0_24px_rgba(249,115,22,0.25)]">
                {/* Inner gradient card */}
                <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-r from-[#3b5bdb] via-[#7c4dff] to-[#ff6b00] px-6 py-5 sm:px-8 sm:py-6">
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: Icon + Text */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                <Gift className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white leading-tight sm:text-lg">
                                    Welcome to Geev!
                                </h2>
                                <p className="mt-0.5 text-sm text-white/80 font-medium leading-snug max-w-sm">
                                    Join our community to create giveaways and help others.
                                </p>
                            </div>
                        </div>

                        {/* Right: Buttons */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <Link
                                href="/login"
                                className={cn(
                                    "inline-flex items-center justify-center rounded-md text-sm font-semibold h-9 px-5",
                                    "bg-[#0f172a] text-white hover:bg-[#1e293b] transition-colors shadow-md"
                                )}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/login?mode=signup"
                                className={cn(
                                    "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold h-9 px-5",
                                    "bg-transparent text-white border border-white/80 hover:bg-white/10 transition-colors"
                                )}
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Decorative blurs */}
                    <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
