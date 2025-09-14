import { FileCardSkeleton } from "../ui/FileCardSkeleton";

export const FileViewLoader = () => {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <FileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};