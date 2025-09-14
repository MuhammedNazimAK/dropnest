import { notFound } from 'next/navigation';
import { PublicFilePreview } from './PublicFilePreview';

async function getSharedFileData(linkId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/share/${linkId}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage(props: unknown) {
  const params = (props as { params?: { linkId?: string } })?.params;
  const linkId = params?.linkId;

  if (!linkId) notFound();

  const file = await getSharedFileData(linkId);
  if (!file) notFound();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 bg-white shadow-md flex justify-between items-center">
        <a href={file.fileUrl} download={file.name}>Download</a>
      </header>
      <main className="flex-grow">
        <PublicFilePreview file={file} />
      </main>
    </div>
  );
}
