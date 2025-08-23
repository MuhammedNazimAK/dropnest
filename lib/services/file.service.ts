import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import ImageKit from "imagekit";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";


// --- HELPER FUNCTIONS ---

// Recursive helper to get all descendant IDs.
async function getDescendantIds(
    tx: PgTransaction<any, any, any> | typeof db,
    folderId: string,
    userId: string
): Promise<{ dbIds: string[], imageKitIds: string[], folderPaths: string[] }> {
    const allDbIdsToDelete: string[] = [];
    const allImageKitIdsToDelete: string[] = [];
    const allFolderPaths: string[] = [];

    const children = await tx.select().from(files)
        .where(and(eq(files.parentId, folderId), eq(files.userId, userId)));

    for (const child of children) {

        allDbIdsToDelete.push(child.id);
        if (child.isFolder) {

            allFolderPaths.push(child.path);

            const nestedIds = await getDescendantIds(tx, child.id, userId);

            allDbIdsToDelete.push(...nestedIds.dbIds);
            allImageKitIdsToDelete.push(...nestedIds.imageKitIds);

            allFolderPaths.push(...nestedIds.folderPaths);

        } else if (child.fileIdInImageKit) {
            allImageKitIdsToDelete.push(child.fileIdInImageKit);
        }
    }
    return { dbIds: allDbIdsToDelete, imageKitIds: allImageKitIdsToDelete, folderPaths: allFolderPaths };
}


async function updateDescendantPaths(
    tx: PgTransaction<any, any, any>,
    parentId: string, newParentPath: string, userId: string
) {
    const children = await tx.select().from(files) // Use .select() instead of .query
        .where(and(eq(files.parentId, parentId), eq(files.userId, userId)));

    for (const child of children) {

        const newChildPath = child.isFolder
            ? `${newParentPath}/${child.id}`
            : `/dropnest/${userId}/${newParentPath}/${child.name}`;

        await tx.update(files).set({ path: newChildPath }).where(eq(files.id, child.id));

        if (child.isFolder) {
            await updateDescendantPaths(tx, child.id, newChildPath, userId);
        }
    }
}


// --- SERVICE FUNCTIONS ---
export async function deleteFilesService(
    itemIds: string[],
    userId: string,
    dbClient: typeof db,
    imageKitClient: ImageKit
) {
    const allDbIdsToDelete: string[] = [];
    const allImageKitIdsToDelete: string[] = [];
    const allImageKitFolderPathsToDelete: string[] = [];

    const initialItems = await dbClient.query.files.findMany({
        where: and(inArray(files.id, itemIds), eq(files.userId, userId))
    });

    if (initialItems.length === 0) {
        throw new Error("No files found to delete.");
    }

    for (const item of initialItems) {
        allDbIdsToDelete.push(item.id);

        if (item.isFolder) {
            const imageKitFolderPath = `/dropnest/${userId}/${item.path}`;
            allImageKitFolderPathsToDelete.push(imageKitFolderPath);

            const nestedIds = await getDescendantIds(dbClient, item.id, userId);
            allDbIdsToDelete.push(...nestedIds.dbIds);
            allImageKitIdsToDelete.push(...nestedIds.imageKitIds);
            allImageKitFolderPathsToDelete.push(...nestedIds.folderPaths);

        } else if (item.fileIdInImageKit) {
            allImageKitIdsToDelete.push(item.fileIdInImageKit);
        }
    }

    // 1. Bulk delete from ImageKit
    if (allImageKitIdsToDelete.length > 0) {
        await imageKitClient.bulkDeleteFiles(allImageKitIdsToDelete);
    }

    // Step 2: Now that the files are gone, delete the empty FOLDERS from ImageKit.
    // Must do this one by one, from the deepest nested folder to the shallowest.
    // Reversing the array helps ensure children are deleted before parents.
    if (allImageKitFolderPathsToDelete.length > 0) {

        const fullImageKitPaths = allImageKitFolderPathsToDelete.map(path => `/dropnest/${userId}/${path}`);

        for (const folderPath of allImageKitFolderPathsToDelete.reverse()) {
            try {

                await imageKitClient.deleteFolder(folderPath);

            } catch (folderError: any) {
                // It's safe to ignore "folder not found" errors, as the goal is for it to be gone.
                if (folderError.name !== 'NotFoundError') {
                    console.warn(`Could not delete folder '${folderPath}' from ImageKit: ${folderError.message}`);
                }
            }
        }
    }

    // Step 3: Finally, bulk delete all records from database.
    if (allDbIdsToDelete.length > 0) {
        await dbClient.delete(files).where(inArray(files.id, allDbIdsToDelete));
    }

    return { deletedDbIds: allDbIdsToDelete, deletedImageKitIds: allImageKitIdsToDelete };
}



export async function copyFilesService(
    itemIdToCopy: string,
    targetFolderId: string | null,
    userId: string,
    dbClient: typeof db,
    imageKitClient: ImageKit
) {
    // 1. Find the original item
    const originalItem = await dbClient.query.files.findFirst({
        where: and(eq(files.id, itemIdToCopy), eq(files.userId, userId))
    });

    if (!originalItem) {
        throw new Error("Item to copy not found.");
    }

    // This service currently only handles single file copies.
    // Folder copies would require a recursive deep copy.
    if (originalItem.isFolder) {
        throw new Error("Folder copying is not yet supported.");
    }

    if (!originalItem.fileUrl) {
        throw new Error("Original item has no file URL to copy from.");
    }

    // 2. 2. Determine the destination folder path for ImageKit
    let imageKitFolderPath = `/dropnest/${userId}`;
    let dbParentPath = ''; // The path of the parent folder in the DB

    if (targetFolderId) {
        const targetFolder = await dbClient.query.files.findFirst({
            where: and(eq(files.id, targetFolderId), eq(files.isFolder, true)),
            columns: { path: true }
        });
        if (!targetFolder) throw new Error("Target folder not found.");
        imageKitFolderPath = `/dropnest/${userId}/${targetFolder.path}`;
        dbParentPath = targetFolder.path;
    }

    // 3. Perform the copy by uploading from the original file's URL
    const uploadResponse = await imageKitClient.upload({
        file: originalItem.fileUrl,
        fileName: originalItem.name,
        folder: imageKitFolderPath,
        useUniqueFileName: true, // Let ImageKit add a suffix
    });

    if (!uploadResponse) {
        throw new Error("ImageKit copy (via upload) operation failed.");
    }

    // 4. Construct the new DB path for the copied file
    const newFileId = uuidv4();

    // The path is either the parent's path + new ID, or just the new ID if at root
    const newDbPath = dbParentPath ? `${dbParentPath}/${newFileId}` : newFileId;

    const [newFileRecord] = await dbClient.insert(files).values({
        id: newFileId,
        name: uploadResponse.name, // Unique name from ImageKit
        path: uploadResponse.filePath,
        size: uploadResponse.size,
        type: uploadResponse.fileType,
        fileUrl: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl,
        fileIdInImageKit: uploadResponse.fileId,
        userId: userId,
        parentId: targetFolderId,
        isFolder: false,
    }).returning();

    return newFileRecord;
}


export async function moveFileService(
    fileIdToMove: string, targetFolderId: string | null, userId: string,
    dbClient: typeof db, imageKitClient: ImageKit
) {
    // 1. Fetch the item to move
    const fileToMove = await dbClient.query.files.findFirst({
        where: and(eq(files.id, fileIdToMove), eq(files.userId, userId))
    });

    // 2. --- VALIDATION ---
    if (!fileToMove) throw new Error("File not found.");
    if (fileIdToMove === targetFolderId) throw new Error("Cannot move a folder into itself.");
    if (fileToMove.parentId === targetFolderId) return fileToMove;

    const targetFolder = targetFolderId ? await dbClient.query.files.findFirst({
        where: and(eq(files.id, targetFolderId), eq(files.userId, userId), eq(files.isFolder, true)),
    }) : null;
    if (targetFolderId && !targetFolder) throw new Error("Target folder not found.");


    if (!fileToMove.isFolder && fileToMove.fileIdInImageKit) {
        try {

            const destinationImageKitFolder = targetFolder
                ? `/dropnest/${userId}/${targetFolder.path}`
                : `/dropnest/${userId}`;

            // "Copy" by re-uploading from the original file's URL
            const uploadResponse = await imageKitClient.upload({
                file: fileToMove.fileUrl, // Use the direct fileUrl, which should be accessible to IK
                fileName: fileToMove.name,
                folder: destinationImageKitFolder.replace(/\/$/, ''),
                useUniqueFileName: false,
            });

            // Delete the original file from ImageKit
            await imageKitClient.deleteFile(fileToMove.fileIdInImageKit);

            // Update the fileToMove object with the new data from the "copied" file
            fileToMove.fileIdInImageKit = uploadResponse.fileId;
            fileToMove.fileUrl = uploadResponse.url;
            fileToMove.thumbnailUrl = uploadResponse.thumbnailUrl;
            fileToMove.path = uploadResponse.filePath;

        } catch (error: any) {
            console.error(`ImageKit operation failed for file ${fileToMove.id}:`, error.message);
            throw new Error(`ImageKit operation failed: ${error.message}`);
        }
    }

    // 3. --- DATABASE TRANSACTION ---
    const newDbPathForFolder = targetFolder ? `${targetFolder.path}/${fileToMove.id}` : fileToMove.id;

    const [updatedItem] = await dbClient.transaction(async (tx) => {
        const [updated] = await tx.update(files).set({
            parentId: targetFolderId,
            path: fileToMove.isFolder ? newDbPathForFolder : fileToMove.path,
            updatedAt: new Date(),
            fileIdInImageKit: fileToMove.isFolder ? fileToMove.fileIdInImageKit : fileToMove.fileIdInImageKit,
            fileUrl: fileToMove.isFolder ? fileToMove.fileUrl : fileToMove.fileUrl,
            thumbnailUrl: fileToMove.isFolder ? fileToMove.thumbnailUrl : fileToMove.thumbnailUrl,
        }).where(eq(files.id, fileIdToMove)).returning();

        if (updated && updated.isFolder) {
            await updateDescendantPaths(tx, updated.id, updated.path, userId);
        }

        return [updated];
    });

    return updatedItem;
}