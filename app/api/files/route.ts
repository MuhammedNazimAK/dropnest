import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const starred = searchParams.get('starred');
    const trash = searchParams.get('trash');
    const active = searchParams.get('active');
    const folderId = searchParams.get('folderId'); // For getting folder info

    // If requesting specific folder info
    if (folderId && folderId !== 'root') {
      const folder = await db.query.files.findFirst({
        where: and(
          eq(files.id, folderId),
          eq(files.userId, userId),
          eq(files.isFolder, true)
        )
      });

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      return NextResponse.json({ folder });
    }

    // Build query conditions
    let conditions = [eq(files.userId, userId)];

    // Parent folder condition
    if (parentId === 'root' || parentId === null) {
      conditions.push(isNull(files.parentId));
    } else if (parentId) {
      conditions.push(eq(files.parentId, parentId));
    }

    // Filter conditions
    if (starred === 'true') {
      conditions.push(eq(files.isStarred, true));
      conditions.push(eq(files.isTrash, false)); // Starred items shouldn't include trash
    } else if (trash === 'true') {
      conditions.push(eq(files.isTrash, true));
    } else if (active === 'true') {
      conditions.push(eq(files.isTrash, false));
    }

    // Fetch files
    const fileList = await db.query.files.findMany({
      where: and(...conditions),
      orderBy: (files, { desc, asc }) => [
        asc(files.isFolder), // Folders first
        desc(files.updatedAt) // Then by most recent
      ]
    });

    return NextResponse.json({ files: fileList });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Keep existing POST method for file uploads unchanged
export async function POST(request: NextRequest) {
  // Your existing file upload logic here
  // This should remain the same as your current implementation
}