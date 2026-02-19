import React from "react"
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// RESPONSIVE CONTAINER - handles max-widths and padding at different breakpoints
export function Container({
  children,
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        // MOBILE-FIRST APPROACH: Start with mobile, scale up at larger breakpoints
        'w-full mx-auto',
        'px-4 py-0',        // Mobile: 16px padding
        'sm:px-6',          // Small devices: 24px padding
        'md:px-8',          // Tablets: 32px padding
        'lg:px-10',         // Small desktops: 40px padding
        'xl:px-12',         // Large desktops: 48px padding
        // MAX-WIDTH CONSTRAINTS for proper content width
        'max-w-full sm:max-w-160 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
