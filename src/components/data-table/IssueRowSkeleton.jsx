import { TableRow, TableCell } from "@/components/ui/table";

const SkeletonBlock = ({ className }) => (
  <div className={`h-4 bg-gray-200 rounded ${className}`} />
);

const IssueRowSkeleton = () => {
  return (
    <TableRow className="animate-pulse p-2">
      {/* TYPE + KEY */}
      <TableCell className="w-[140px] p-2">
        <SkeletonBlock className="w-24" />
      </TableCell>

      {/* SUMMARY */}
      <TableCell className="w-auto p-2">
        <SkeletonBlock className="w-[80%]" />
      </TableCell>

      {/* STATUS */}
      <TableCell className="w-[160px] p-2">
        <SkeletonBlock className="w-24 h-6 rounded-full" />
      </TableCell>

      {/* PRIORITY */}
      <TableCell className="w-[160px] p-2">
        <SkeletonBlock className="w-20 h-6 rounded-full" />
      </TableCell>

      {/* FLAG */}
      <TableCell className="w-[60px] text-center p-2">
        <SkeletonBlock className="w-4 h-4 mx-auto rounded-full" />
      </TableCell>

      {/* ASSIGNEE */}
      <TableCell className="w-[80px] text-center p-2">
        <SkeletonBlock className="w-8 h-8 mx-auto rounded-full" />
      </TableCell>

      {/* ACTIONS */}
      <TableCell className="w-[56px] text-center p-2">
        <SkeletonBlock className="w-4 h-4 mx-auto" />
      </TableCell>
    </TableRow>
  );
};

export default IssueRowSkeleton;
