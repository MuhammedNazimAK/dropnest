import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, like, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { PgTransaction } from "drizzle-orm/pg-core";


// Recursive helper function to update paths of all children of a moved folder
async function updateDescendantPaths(
  tx: PgTransaction<any, any, any>, // The database transaction object
  parentId: string,
  newParentPath: string,
  userId: string
) {
  const children = await tx.select({ id: files.id, name: files.name, isFolder: files.isFolder })
    .from(files)
    .where(and(eq(files.parentId, parentId), eq(files.userId, userId)));

  for (const child of children) {
    const newChildPath = `${newParentPath}/${child.name}`;
    await tx.update(files)
      .set({ path: newChildPath })
      .where(eq(files.id, child.id));

    // If the child is also a folder, continue the recursion
    if (child.isFolder) {
      await updateDescendantPaths(tx, child.id, newChildPath, userId);
    }
  }
}



export async function PATCH(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { targetFolderId }: { targetFolderId: string | null } = await request.json();
    const fileIdToMove = params.fileId;

    // 1. find the file/folder to move
    const fileToMove = await db.query.files.findFirst({
      where: and(eq(files.id, fileIdToMove), eq(files.userId, userId))
    });

    if (!fileToMove) {
      return NextResponse.json({ erorr: "File not found" }, { status: 404 })
    }

    // 2. Prevent moving a folder into itself
    if (fileIdToMove === targetFolderId) {
      return NextResponse.json({ error: "Cannot move a folder into itself" }, { status: 409 });
    }

    // 3. Prevent moving a file to its current location
    if (fileToMove.parentId === targetFolderId) {
      return NextResponse.json({ message: "File is already in the target location", file: fileToMove });
    }

    // 4. Fetch the target folder (if not moving to root)
    let targetFolder = null;
    if (targetFolderId) {
      targetFolder = await db.query.files.findFirst({
        where: and(
          eq(files.id, targetFolderId),
          eq(files.userId, userId),
          eq(files.isFolder, true)
        ),
      });

      if (!targetFolder) {
        return NextResponse.json({ error: "Target folder not found" }, { status: 404 });
      }
    }

    // --- PATH REGENERATION ---
    const newPath = targetFolder ? `${targetFolder.path}/${fileToMove.name}` : fileToMove.name;

    // --- DATABASE TRANSACTION ---
    // A transaction ensures that if any part of the operation fails,
    // all changes are rolled back, preventing data corruption.
    const [updatedItem] = await db.transaction(async (tx) => {
      // Update the main file/folder's parentId and path
      const [updated] = await tx.update(files)
        .set({
          parentId: targetFolderId,
          path: newPath,
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileIdToMove))
        .returning();

      // If the item moved was a folder, must update the paths of all its children
      if (updated && updated.isFolder) {
        await updateDescendantPaths(tx, updated.id, updated.path, userId);
      }

      return [updated];
    });

    return NextResponse.json({
      success: true,
      message: `Moved "${updatedItem.name}" successfully`,
      file: updatedItem,
    });

  } catch (error) {
        console.error("Error moving file:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}