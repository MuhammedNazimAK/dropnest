import { Skeleton } from "@/components/ui/skeleton";
import { FileCardSkeleton } from "../ui/FileCardSkeleton";

export const FileViewLoader = () => {
  return (
    <div className="mt-4">
      {/* Skeleton for Breadcrumbs & View Toggles */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-7 w-1/2 md:w-1/3" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <FileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};