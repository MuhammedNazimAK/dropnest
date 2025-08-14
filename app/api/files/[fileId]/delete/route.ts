import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  console.error("CRITICAL: IMAGEKIT_PRIVATE_KEY is not defined!");
};

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});

/**
 * A recursive function to gather all nested files and folders for deletion.
 * @param folderId - The starting folder's database ID.
 * @param userId - The ID of the user performing the action.
 * @returns An object containing lists of database IDs and ImageKit file IDs to be deleted.
 */

async function getCascadingDeleteIds(folderId: string, userId: string): Promise<{ dbIds: string[], imageKitIds: string[] }> {
  
  const allDbIdsToDelete: string[] = [];
  const allImageKitIdsToDelete: string[] = [];

  // Find all immediate children of the current folder
  const children = await db.query.files.findMany({
    where: and(eq(files.parentId, folderId), eq(files.userId, userId)),
  });

  for (const child of children) {
    allDbIdsToDelete.push(child.id); // Add the childs own id for deletion

    if (child.isFolder) {
      // If the child is a folder, recurse into it
      const nestedResult = await getCascadingDeleteIds(child.id, userId);
      allDbIdsToDelete.push(...nestedResult.dbIds);
      allImageKitIdsToDelete.push(...nestedResult.imageKitIds);
   
    } else if (child.fileIdInImageKit) {

      // If its a file with an image kit id, add it to the deletion list
      allImageKitIdsToDelete.push(child.fileIdInImageKit);
    }
  }

  return { dbIds: allDbIdsToDelete, imageKitIds: allImageKitIdsToDelete };
}


export async function DELETE(request: NextRequest, { params }: { params: { fileId: string } }
) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fileId: fileIdToDelete } = params;

    // Find the initial item (files or folder)
    const initialItem  = await db.query.files.findFirst({
      where: and(eq(files.id, fileIdToDelete), eq(files.userId, userId)),
    });

    if (!initialItem) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    const dbRecordIdsToDelete = [initialItem.id];
    const imageKitFileIdsToDelete: string[] = [];

    // 2. If it's a folder, recursively gather all children IDs
    if (initialItem.isFolder) {

      const nestedIds = await getCascadingDeleteIds(initialItem.id, userId);
      dbRecordIdsToDelete.push(...nestedIds.dbIds);
      imageKitFileIdsToDelete.push(...nestedIds.imageKitIds);
    } else if (initialItem.fileIdInImageKit) {

      // If it's just a single file, add its ImageKit ID
      imageKitFileIdsToDelete.push(initialItem.fileIdInImageKit);
    }

    // 3. Bulk delete from ImageKit
    if (imageKitFileIdsToDelete.length > 0) {
      try {

        const deleteResult = await imageKit.bulkDeleteFiles(imageKitFileIdsToDelete);
        console.log("ImageKit bulk delete successful. Response:", deleteResult);
      } catch (imageKitError: any) {

        // This will catch errors specifically from the ImageKit SDK
        console.error("!!! ERROR during ImageKit bulk delete !!!");
        console.error("Error Name:", imageKitError.name);
        console.error("Error Message:", imageKitError.message);
        // Do NOT proceed with database deletion if ImageKit fails, to keep things in sync.
        return NextResponse.json(
          { message: "Failed to delete files from cloud storage.", error: imageKitError.message },
          { status: 500 }
        );
      }
    }

    // 4. Bulk delete from the database
    if (dbRecordIdsToDelete.length > 0) {
        await db.delete(files).where(inArray(files.id, dbRecordIdsToDelete));
    }

      return NextResponse.json({
      success: true,
      message: "Item(s) deleted permanently.",
      deletedIds: dbRecordIdsToDelete, // Send back all deleted DB IDs
    });

  } catch (error) {

    console.error("Error during permanent deletion:", error);
    return NextResponse.json(
      { message: "An error occurred during deletion." },
      { status: 500 }
    );
  }
}