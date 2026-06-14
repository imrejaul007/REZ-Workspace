import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning:
          "border-transparent bg-warning-500 text-white hover:bg-warning-600",
      },
      color: {
        gray: "border-transparent bg-gray-100 text-gray-800",
        red: "border-transparent bg-red-100 text-red-800",
        yellow: "border-transparent bg-yellow-100 text-yellow-800",
        green: "border-transparent bg-green-100 text-green-800",
        blue: "border-transparent bg-blue-100 text-blue-800",
        indigo: "border-transparent bg-indigo-100 text-indigo-800",
        purple: "border-transparent bg-purple-100 text-purple-800",
        pink: "border-transparent bg-pink-100 text-pink-800",
        orange: "border-transparent bg-orange-100 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, color, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, color }), className)} {...props} />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };