import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import DashboardClient from './dashboard-client';
import { files } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user's files from database
  const userFiles = await db
    .select()
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(files.createdAt);

  return (
    <DashboardClient 
      initialFiles={userFiles} 
      userId={userId} 
    />
  );
}
