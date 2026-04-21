import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-[14px]" />
        <Skeleton className="h-28 rounded-[14px]" />
      </div>
      <Skeleton className="h-40 rounded-[14px]" />
      <Skeleton className="h-32 rounded-[14px]" />
    </div>
  );
}
