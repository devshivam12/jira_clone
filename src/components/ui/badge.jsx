import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-md p-1",
        borderGradient:
          "relative px-0 rounded-sm bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",

      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, children, ...props }) {
  // For borderGradient, wrap inner content with a solid bg container
  if (variant === "borderGradient") {
    return (
      <div className={cn(badgeVariants({ variant }), className)} {...props}>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 text-neutral-500 font-semibold">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge, badgeVariants }