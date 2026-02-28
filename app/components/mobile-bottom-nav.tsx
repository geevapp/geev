"use client";

import { Home, Plus, Settings, Trophy, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateGiveawayModal } from "@/components/create-giveaway-modal";
import { CreatePostModal } from "@/components/create-post-modal";
import { CreateRequestModal } from "@/components/create-request-modal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app-context";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MobileBottomNav() {
  const { user } = useAppContext();
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGiveawayModal, setShowGiveawayModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleCreatePost = (type: "giveaway" | "help-request") => {
    if (type === "giveaway") {
      setShowGiveawayModal(true);
    } else {
      setShowRequestModal(true);
    }
  };

  const navigation = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    {
      name: "Create",
      href: "#",
      icon: Plus,
      action: () => setShowCreateModal(true),
    },
    { name: "Profile", href: `/profile/${user?.id}`, icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isCreateButton = item.name === "Create";

            return (
              <div key={item.name} className="flex items-center justify-center">
                {item.action ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={item.action}
                    className={cn(
                      "flex flex-col items-center justify-center h-12 w-12 p-0",
                      isCreateButton &&
                        "bg-orange-600 hover:bg-orange-700 text-white rounded-full",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex flex-col items-center justify-center h-12 w-12"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "flex flex-col items-center justify-center h-12 w-12 p-0",
                        isActive && "text-orange-600 dark:text-orange-400",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSelectType={handleCreatePost}
      />
      <CreateGiveawayModal
        open={showGiveawayModal}
        onOpenChange={setShowGiveawayModal}
      />
      <CreateRequestModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
      />
    </>
  );
}
