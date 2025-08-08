import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Find the file
    const [file] = await db.select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId)
        )
      );

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Toggle the star status
    const [updatedFile] = await db.update(files)
      .set({
        isStarred: !file.isStarred,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      file: updatedFile,
      message: updatedFile.isStarred ? "File starred" : "File unstarred"
    });

  } catch (error) {
    console.error("Star toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}