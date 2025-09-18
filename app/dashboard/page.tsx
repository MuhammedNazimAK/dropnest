import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const [initialFiles, initialRecentFiles] = await Promise.all([

    db.query.files.findMany({
      where: and(
        eq(files.userId, userId),
        isNull(files.parentId),
        eq(files.isTrash, false)
      ),
    }),

    db.query.files.findMany({
      where: and(
        eq(files.userId, userId),
        eq(files.isFolder, false) 
      ),
      orderBy: [desc(files.lastAccessedAt)],
      limit: 5,
    }),
  ]);

  return (
    <DashboardClient 
      initialFiles={initialFiles}
      initialRecentFiles={initialRecentFiles}
      userId={userId} 
    />
  );
}