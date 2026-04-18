import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[6px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.028)] px-4 py-2 text-[15px] text-[rgba(255,255,255,0.92)] font-['Outfit'] placeholder:text-[rgba(255,255,255,0.3)] transition-colors focus:outline-none focus:border-[#FF5722] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
