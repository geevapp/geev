"use client";
import {
  Calendar,
  Gift,
  Heart,
  LucideIcon,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ActivityNavItem = {
  name: string;
  no?: number;
  href: string;
};

const activityNav: ActivityNavItem[] = [
  { name: "Recent Activity", href: "#" },
  { name: "My Posts", href: "#", no: 2 },
  { name: "My Entries", href: "#", no: 0 },
  { name: "My Contributions", href: "#", no: 0 },
];

export default function ActivityMain() {
  const [isNavSelected, setIsNavSelected] = useState<string>("Recent Activity");
  return (
    <div className="max-w-160 mx-auto pt-6 pb-20 px-5 sm:px-0">
      <p className="flex items-center gap-3 text-[28px] font-bold">
        <TrendingUp size={32} className="text-muted-foreground" />
        Activity
      </p>

      <div className="mt-6 bg-gray-200 dark:bg-[#262626] p-0.75 rounded-[10px] w-full flex items-center gap-1 flex-wrap">
        {activityNav.map((item) => (
          <div
            key={item.name}
            className={`${isNavSelected === item.name ? "ring ring-orange-300 dark:ring-[#FFFFFF26] bg-white dark:bg-[#FFFFFF0B]" : ""}  py-1.5 sm:py-1 px-3 sm:px-0 flex-1 min-w-[calc(50%-0.125rem)] sm:min-w-0 flex justify-center rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-[#FFFFFF08]`}
            onClick={() => setIsNavSelected(item.name)}
          >
            <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium text-center">
              {item.name} {item.no !== undefined && <span>({item.no})</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 ring ring-gray-200 dark:ring-[#FFFFFF26] p-6 rounded-[14px] bg-white dark:bg-transparent">
        <p className="font-semibold pb-8 text-xl text-gray-900 dark:text-white">
          Community Activity
        </p>

        <div className="space-y-4">
          {ActivityData.length === 0 ? (
            <div>
              <p className="text-muted-foreground text-lg text-center">
                No activity to show yet
              </p>
            </div>
          ) : (
            ActivityData.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 ring ring-gray-200 dark:ring-[#FFFFFF26] py-10 px-4 rounded-[14px] bg-gray-50 dark:bg-transparent"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={activity.pfp || ""}
                    alt={activity.name || ""}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activity.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-white dark:text-[#BEDBFF] bg-blue-600 dark:bg-[#1C398E] py-1 px-2 rounded-full">
                      <Trophy size={13} /> Contributor
                    </p>
                  </div>

                  <div className="flex gap-1 items-center mt-2">
                    {activity.icon && (
                      <activity.icon
                        size={16}
                        className="text-muted-foreground"
                      />
                    )}
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {activity.desc}
                    </p>
                  </div>

                  <div className="flex gap-1 items-center mt-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.dateTime}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type ActivityDataType = {
  id?: number;
  name?: string;
  pfp?: string;
  tag?: string;
  icon?: LucideIcon;
  desc?: string;
  dateTime?: string;
};

const ActivityData: ActivityDataType[] = [
  {
    id: 1,
    name: "David Kim",
    pfp: "/wallet/david-1.png",
    tag: "Contributor",
    icon: Gift,
    desc: "Created a giveaway: 🎮 Ultimate Gaming Setup Showcase + Giveaway",
    dateTime: "13/03/2024 at 11:15:00",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    pfp: "/wallet/sarah.png",
    tag: "Contributor",
    icon: Gift,
    desc: "Created a giveaway: 🎨 Design Tutorial Video + Free Resources",
    dateTime: "12/03/2024 at 09:30:00",
  },
  {
    id: 3,
    name: "David Kim",
    pfp: "/wallet/david-1.png",
    tag: "Contributor",
    icon: Heart,
    desc: "Created a help request: 💚 Mental Health Support - Therapy Sessions",
    dateTime: "13/03/2024 at 11:15:00",
  },
];

// const ActivityData: ActivityDataType[] = []
