import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const IssueRowSkeleton = () => {
  return (
    <div className="flex items-center w-full border-b bg-white">
      {/* Task ID Skeleton */}
      <div className="w-[120px] min-w-[120px] max-w-[120px] p-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="flex-1 p-2 min-w-[250px]">
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Status Skeleton */}
      <div className="w-[140px] min-w-[140px] max-w-[140px] p-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Importance Skeleton */}
      <div className="w-[140px] min-w-[140px] max-w-[140px] p-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Flag Skeleton */}
      <div className="w-[50px] min-w-[50px] max-w-[50px] p-2 flex justify-center">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>

      {/* Assignee Skeleton */}
      <div className="w-[60px] min-w-[60px] max-w-[60px] p-2 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Actions Skeleton */}
      <div className="w-[50px] min-w-[50px] max-w-[50px] p-2 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
};

export default IssueRowSkeleton;
