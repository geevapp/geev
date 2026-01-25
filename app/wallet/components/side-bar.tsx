"use client";

import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Home,
  LucideIcon,
  Plus,
  Settings,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import ProfileCard from "./profile-card";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";
type MenuP = {
  name: string;
  icon: LucideIcon;
  href: string;
};

const menu: MenuP[] = [
  {
    name: "Feed",
    icon: Home,
    href: "/feed",
  },
  {
    name: "Activity",
    icon: TrendingUp,
    href: "#activity",
  },
  {
    name: "Leaderboard",
    icon: Trophy,
    href: "#leaderboard",
  },
  {
    name: "Settings",
    icon: Settings,
    href: "#settings",
  },
];

export default function SideBar() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`${
          isOpen ? "w-64" : "w-16"
        } fixed h-screen border-r border-slate-200 dark:border-slate-800 bg-background flex flex-col transition-all duration-300 z-999 
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-16 flex items-center justify-end pr-2">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
        {isOpen && <ProfileCard />}

        <div className="mt-5">
          {menu.map((item) => (
            <div key={item.name} className="flex flex-col">
              <div className="flex items-center gap-4 py-2 pl-5 hover:bg-slate-700/70 cursor-pointer">
                <item.icon size={20} />
                {isOpen && <Link href={item.href}>{item.name}</Link>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto ">
          {isOpen && (
            <>
              <div className="mx-4">
                <button className="bg-orange-500 text-white font-medium w-full flex items-center justify-center text-sm gap-3 p-1.5 rounded-lg cursor-pointer hover:bg-orange-700 transition">
                  <Plus size={15} />
                  Create Post
                </button>
              </div>
              <div className="w-full bg-[#364153] h-px mt-4" />

              <div className="mt-6 mx-4 text-slate-900 dark:text-[#99A1AF]">
                <p className="text-sm">YOUR STATS</p>

                <div className="my-4 space-y-3">
                  <Stats name="Posts" icon={Gift} figure={45} />
                  <Stats name="Followers" icon={Users} figure={1250} />
                  <Stats name="Badges" icon={Trophy} figure={3} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

type StatsProps = {
  name: string;
  icon: LucideIcon;
  figure: number;
};

function Stats({ name, icon: IconComponent, figure }: StatsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <IconComponent size={15} />
        <p>{name}</p>
      </div>

      <p className="dark:text-white text-black text-sm">{figure}</p>
    </div>
  );
}
