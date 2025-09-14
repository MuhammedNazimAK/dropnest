import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { getIdFromRequest } from "@/utils/requestHelpers";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Generic handler for patching a file/folder (e.g., for renaming)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = getIdFromRequest(request, "files");
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }
    const { name } = await request.json(); // Expecting the new name in the body

    if (!name) {
      return NextResponse.json({ error: "New name is required" }, { status: 400 });
    }

    // Update the item's name in the database
    const [updatedFile] = await db
      .update(files)
      .set({ name: name, updatedAt: new Date() })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    if (!updatedFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (error) {
    console.error("[FILE_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}