import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const IssueRowSkeleton = () => {
  return (
    <div className="flex items-center w-full border-b bg-white">
      {/* Task ID Skeleton */}
      <div className="w-[160px] min-w-[160px] max-w-[160px] p-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="flex-1 p-2 min-w-0">
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Status Skeleton */}
      <div className="w-[160px] min-w-[160px] max-w-[160px] p-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Importance Skeleton */}
      <div className="w-[160px] min-w-[160px] max-w-[160px] p-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Flag Skeleton */}
      <div className="w-[60px] min-w-[60px] max-w-[60px] p-2 flex justify-center">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>

      {/* Assignee Skeleton */}
      <div className="w-[80px] min-w-[80px] max-w-[80px] p-2 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Actions Skeleton */}
      <div className="w-[56px] min-w-[56px] max-w-[56px] p-2 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
};

export default IssueRowSkeleton;
