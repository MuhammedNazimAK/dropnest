import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { getIdFromRequest } from "@/utils/requestHelpers";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(
  request: NextRequest
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = getIdFromRequest(request, "files");
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const { isStarred } = await request.json();
    if (typeof isStarred !== 'boolean') {
      return NextResponse.json({ error: "Invalid 'isStarred' value in request body" }, { status: 400 });
    }

    // Set the star status directly from the client's value ---
    const [updatedFile] = await db.update(files)
      .set({
        isStarred: isStarred, // Set the value directly
        updatedAt: new Date()
      })
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId)
        )
      )
      .returning();

    // If nothing was updated, it means the file wasn't found or didn't belong to the user
    if (!updatedFile) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    // Message is now determined by the final state of the updated file
    const message = updatedFile.isStarred
      ? `${updatedFile.isFolder ? 'Folder' : 'File'} starred`
      : `${updatedFile.isFolder ? 'Folder' : 'File'} unstarred`;

    return NextResponse.json({
      success: true,
      file: updatedFile,
      message: message
    });

  } catch (error) {
    console.error("Star toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update star status" },
      { status: 500 }
    );
  }
}