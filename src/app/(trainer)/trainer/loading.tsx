import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[14px]" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-[14px]" />
      ))}
    </div>
  );
}
