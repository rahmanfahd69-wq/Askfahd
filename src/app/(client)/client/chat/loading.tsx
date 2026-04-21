import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col gap-4 h-[70vh]">
      <Skeleton className="h-8 w-48" />
      <div className="flex-1 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-12 w-2/3 rounded-[14px]" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-3/4 rounded-[14px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-[14px]" />
        </div>
      </div>
      <Skeleton className="h-14 rounded-[12px]" />
    </div>
  );
}
