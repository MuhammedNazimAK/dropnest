import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetFolderId } = await request.json(); // null for root level
    const { fileId } = params;

    // Check if file exists and belongs to user
    const file = await db.query.files.findFirst({
      where: and(
        eq(files.id, fileId),
        eq(files.userId, userId),
        eq(files.isTrash, false)
      )
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If targetFolderId is provided, validate target folder
    if (targetFolderId) {
      const targetFolder = await db.query.files.findFirst({
        where: and(
          eq(files.id, targetFolderId),
          eq(files.userId, userId),
          eq(files.isFolder, true),
          eq(files.isTrash, false)
        )
      });

      if (!targetFolder) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }

      // Prevent moving folder into itself or its children
      if (file.isFolder) {
        if (targetFolderId === fileId) {
          return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 });
        }

        // Check if target is a child of the folder being moved
        let currentParent = targetFolder.parentId;
        while (currentParent) {
          if (currentParent === fileId) {
            return NextResponse.json({ 
              error: 'Cannot move folder into its own subfolder' 
            }, { status: 400 });
          }
          
          const parent = await db.query.files.findFirst({
            where: eq(files.id, currentParent)
          });
          currentParent = parent?.parentId || null;
        }
      }
    }

    // Build new path
    let newPath = file.name;
    if (targetFolderId) {
      const targetFolder = await db.query.files.findFirst({
        where: eq(files.id, targetFolderId)
      });
      newPath = `${targetFolder?.path}/${file.name}`;
    }

    // Update file/folder location
    const updatedFile = await db.update(files)
      .set({ 
        parentId: targetFolderId || null,
        path: newPath,
        updatedAt: new Date()
      })
      .where(eq(files.id, fileId))
      .returning();

    // If moving a folder, update all children paths
    if (file.isFolder) {
      const oldPath = file.path;
      await db.execute(`
        UPDATE files 
        SET path = REPLACE(path, '${oldPath}', '${newPath}'), 
            updated_at = NOW()
        WHERE user_id = '${userId}' 
        AND path LIKE '${oldPath}/%'
      `);
    }

    return NextResponse.json({
      success: true,
      file: updatedFile[0]
    });

  } catch (error) {
    console.error('Error moving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}