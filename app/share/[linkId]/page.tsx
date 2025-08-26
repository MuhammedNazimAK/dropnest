// This needs to be a server component for best performance
import { notFound } from 'next/navigation';
import { PublicFilePreview } from './PublicFilePreview';
// We can create a dedicated preview component for the public page

async function getSharedFileData(linkId: string) {
  // This function fetches data directly on the server
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/share/${linkId}`, {
      cache: 'no-store' // Always fetch the latest data
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage({ params }: { params: { linkId: string } }) {
  const file = await getSharedFileData(params.linkId);

  if (!file) {
    notFound(); // If the link is invalid, show a 404 page
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 bg-white shadow-md flex justify-between items-center">
        {/* Your app logo */}
        <a href={file.fileUrl} download={file.name} className="...">Download</a>
      </header>
      <main className="flex-grow">
        {/* We'll create this client component to render the preview */}
        <PublicFilePreview file={file} />
      </main>
    </div>
  );
}