import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-lg">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-40 rounded-[14px]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-[14px]" />
        <Skeleton className="h-20 rounded-[14px]" />
      </div>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-[14px]" />
      ))}
    </div>
  );
}
