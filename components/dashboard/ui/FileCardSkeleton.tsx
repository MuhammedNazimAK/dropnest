import { Skeleton } from "@/components/ui/skeleton";

export const FileCardSkeleton = () => {
  return (
    // The outer div mimics the main card container
    <div className="h-52 w-full rounded-xl border bg-white dark:bg-gray-800/50 p-4 flex flex-col">
      {/* Top section: Icon and menu */}
      <div className="flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
      {/* Middle section: Thumbnail (this grows) */}
      <div className="flex-grow w-full flex items-center justify-center mb-2 min-h-0">
         <Skeleton className="h-full w-full rounded-md" />
      </div>
      {/* Bottom section: File name */}
      <div className="flex-shrink-0">
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
};