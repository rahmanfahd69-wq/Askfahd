import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] px-2.5 py-1 text-[11px] font-['Syne'] font-700 uppercase tracking-[1.5px] transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-[rgba(255,87,34,0.12)] text-[#FF8A65] border border-[rgba(255,87,34,0.3)]",
        secondary:   "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.55)] border border-[rgba(255,255,255,0.07)]",
        success:     "bg-[rgba(34,197,94,0.1)] text-green-400 border border-green-500/20",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20",
        outline:     "border border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.55)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
