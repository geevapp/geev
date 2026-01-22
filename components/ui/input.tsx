import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        [
          "flex h-9 w-full min-w-0 rounded-md border border-border",
          "bg-background px-3 py-1 text-sm",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "selection:bg-primary selection:text-primary-foreground",
          "outline-none",
          "transition-colors",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
          "dark:bg-input/30",
        ].join(" "),
        className
      )}
      {...props}
    />
  )
}

export { Input }
