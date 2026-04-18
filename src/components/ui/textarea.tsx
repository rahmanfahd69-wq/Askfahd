import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-[6px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.028)] px-4 py-3 text-[14px] text-[rgba(255,255,255,0.92)] font-['Outfit'] leading-relaxed placeholder:text-[rgba(255,255,255,0.3)] transition-colors focus:outline-none focus:border-[#FF5722] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
