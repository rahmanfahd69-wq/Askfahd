import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-[8px] bg-[rgba(255,255,255,0.04)]",
        className
      )}
    />
  );
}
