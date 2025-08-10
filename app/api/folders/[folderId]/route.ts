import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Rename folder
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    const { folderId } = params;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Check if folder exists and belongs to user
    const folder = await db.query.files.findFirst({
      where: and(
        eq(files.id, folderId),
        eq(files.userId, userId),
        eq(files.isFolder, true),
        eq(files.isTrash, false)
      )
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if folder with same name exists in same parent
    const existingFolder = await db.query.files.findFirst({
      where: and(
        eq(files.name, name),
        eq(files.userId, userId),
        eq(files.isFolder, true),
        eq(files.isTrash, false),
        folder.parentId ? eq(files.parentId, folder.parentId) : isNull(files.parentId)
      )
    });

    if (existingFolder && existingFolder.id !== folderId) {
      return NextResponse.json({ error: 'Folder with this name already exists' }, { status: 409 });
    }

    // Update folder name and path
    const oldPath = folder.path;
    const newPath = folder.parentId 
      ? folder.path.replace(/[^/]+$/, name) // Replace last part of path
      : name; // Root level folder

    const updatedFolder = await db.update(files)
      .set({ 
        name,
        path: newPath,
        updatedAt: new Date()
      })
      .where(eq(files.id, folderId))
      .returning();

    // Update paths of all children (files and subfolders)
    await db.execute(`
      UPDATE files 
      SET path = REPLACE(path, '${oldPath}', '${newPath}'), 
          updated_at = NOW()
      WHERE user_id = '${userId}' 
      AND path LIKE '${oldPath}/%'
    `);

    return NextResponse.json({
      success: true,
      folder: updatedFolder[0]
    });

  } catch (error) {
    console.error('Error renaming folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;

    // Check if folder exists and belongs to user
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

    // Check if folder has children
    const children = await db.query.files.findMany({
      where: and(
        eq(files.parentId, folderId),
        eq(files.userId, userId),
        eq(files.isTrash, false)
      )
    });

    if (children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete folder with items. Move or delete items first.' 
      }, { status: 400 });
    }

    // Move folder to trash (soft delete)
    const deletedFolder = await db.update(files)
      .set({ 
        isTrash: true,
        updatedAt: new Date()
      })
      .where(eq(files.id, folderId))
      .returning();

    return NextResponse.json({
      success: true,
      folder: deletedFolder[0]
    });

  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}