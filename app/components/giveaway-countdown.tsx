"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

type GiveawayCountdownProps = {
  endsAt: Date;
  className?: string;
  showIcon?: boolean;
};

export function GiveawayCountdown({
  endsAt,
  className = "",
  showIcon = true,
}: GiveawayCountdownProps) {
  const [label, setLabel] = useState(() => {
    const diff = endsAt.getTime() - Date.now();
    return diff <= 0 ? "Ended" : formatRemaining(diff);
  });

  useEffect(() => {
    const tick = () => {
      const diff = endsAt.getTime() - Date.now();
      setLabel(diff <= 0 ? "Ended" : formatRemaining(diff));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const ended = endsAt.getTime() <= Date.now();

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-medium tabular-nums ${
        ended
          ? "text-gray-500 dark:text-gray-400"
          : "text-amber-700 dark:text-amber-400"
      } ${className}`}
    >
      {showIcon && <Clock className="w-4 h-4 shrink-0" />}
      <span>{ended ? "Ended" : `${label} left`}</span>
    </div>
  );
}
