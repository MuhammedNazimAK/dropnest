import type { File as DbFile } from '@/lib/db/schema';
import { File as FileIcon } from 'lucide-react';

const isImage = (type: string) => type.startsWith('image/');
const isVideo = (type: string) => type.startsWith('video/');
const isAudio = (type: string) => type.startsWith('audio/');

export const FilePreview = ({ file }: { file: DbFile }) => {
  if (isImage(file.type)) {
    return (
      <img
        src={file.fileUrl}
        alt={file.name}
        className="object-contain w-full h-full"
      />
    );
  }

  if (isVideo(file.type)) {
    return (
      <video controls className="object-contain w-full h-full">
        <source src={file.fileUrl} type={file.type} />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (isAudio(file.type)) {
    return (
       <div className="p-8">
         <audio controls src={file.fileUrl}>
           Your browser does not support the audio element.
         </audio>
       </div>
    );
  }

  // Fallback for documents, PDFs, etc.
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <FileIcon className="w-24 h-24" />
      <p className="mt-4 text-lg">No preview available for this file type.</p>
    </div>
  );
};