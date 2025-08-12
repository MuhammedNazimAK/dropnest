import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId'); // For getting folder info

    const active = searchParams.get('active');

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

    const parentId = searchParams.get('parentId');
    const starred = searchParams.get('starred') === 'true';
    const trash = searchParams.get('trash') === 'true';

    // Build query conditions
    let conditions = [eq(files.userId, userId)];

      if (trash) {
      conditions.push(eq(files.isTrash, true));
    } else {
      // For any view that is NOT trash, only want non-trashed items.
      conditions.push(eq(files.isTrash, false));

      if (starred) {
        // If it's the starred view, get all starred items.
        conditions.push(eq(files.isStarred, true));
      } else {
        // Otherwise, it's a normal folder view. Filter by parentId.
        if (parentId && parentId !== 'root') {
          conditions.push(eq(files.parentId, parentId));
        } else {
          // Default to the root folder if no parentId is provided.
          conditions.push(isNull(files.parentId));
        }
      }
    }

    // Fetch files
    const fileList = await db.query.files.findMany({
      where: and(...conditions),
       orderBy: [
        desc(files.isFolder), // Show folders first
        desc(files.updatedAt)
      ]
    });

    return NextResponse.json({ files: fileList });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
