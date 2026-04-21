import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-5xl">
      <div className="space-y-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[14px]" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-[14px]" />
      ))}
    </div>
  );
}
