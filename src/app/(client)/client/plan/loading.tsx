import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-[10px]" />
        <Skeleton className="h-10 w-28 rounded-[10px]" />
      </div>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-[14px]" />
      ))}
    </div>
  );
}
