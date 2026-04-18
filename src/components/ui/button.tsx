"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-['Syne'] font-bold uppercase tracking-widest text-sm transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[#FF5722] text-white rounded-[6px] hover:bg-[#FF8A65] hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,87,34,0.25)] active:translate-y-0",
        secondary:
          "bg-transparent text-[rgba(255,255,255,0.55)] border border-[rgba(255,255,255,0.07)] rounded-[6px] hover:border-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.92)]",
        ghost:
          "bg-transparent text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.92)] hover:bg-[rgba(255,255,255,0.05)] rounded-[6px]",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 rounded-[6px] hover:bg-red-500/20",
      },
      size: {
        sm:      "h-9  px-4  text-[11px] tracking-[1.5px]",
        default: "h-11 px-8  text-[13px] tracking-[1.5px]",
        lg:      "h-13 px-10 text-[14px] tracking-[2px]",
        icon:    "h-9  w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
