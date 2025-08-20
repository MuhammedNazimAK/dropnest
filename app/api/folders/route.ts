import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from "uuid";


// Create folder
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    let parentFolder = null;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, parentId } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Validate parent folder exists if parentId provided
    if (parentId) {
      parentFolder = await db.query.files.findFirst({
        where: and(
          eq(files.id, parentId),
          eq(files.userId, userId),
          eq(files.isFolder, true),
          eq(files.isTrash, false)
        )
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    // Check if folder with same name exists in same location
    const existingFolder = await db.query.files.findFirst({
      where: and(
        eq(files.name, name),
        eq(files.userId, userId),
        eq(files.isFolder, true),
        eq(files.isTrash, false),
        parentId ? eq(files.parentId, parentId) : isNull(files.parentId)
      )
    });

    if (existingFolder) {
      return NextResponse.json({ 
        error: 'A folder with this name already exists in this location' 
      }, { status: 409 });
    }

    // Build folder path
    const newFolderId = uuidv4();
    let folderPath = newFolderId;

    if (parentFolder) {
      // For a subfolder, the path is parent's_path/new_folder's_id
      folderPath = `${parentFolder.path}/${newFolderId}`;
    }

    // Create folder
    const newFolder = await db.insert(files).values({
      id: newFolderId,
      name,
      path: folderPath,
      size: 0,
      type: 'folder',
      fileUrl: '',
      userId,
      parentId: parentId || null,
      isFolder: true,
      isStarred: false,
      isTrash: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({
      success: true,
      folder: newFolder[0]
    });

  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}