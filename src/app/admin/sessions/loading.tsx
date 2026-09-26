import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsLoading() {
  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-52" />
      </div>

      <div className="space-y-2 rounded-lg border border-border p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
