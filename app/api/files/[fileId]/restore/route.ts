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
                    eq(files.userId, userId),
                    eq(files.isTrash, true) // Only restore files that are in trash
                )
            );

        if (!file) {
            return NextResponse.json({ error: "File not found in trash" }, { status: 404 });
        }

        // Restore the file (set isTrash to false)
        const [updatedFile] = await db.update(files)
            .set({
                isTrash: false,
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
            message: "File restored successfully"
        });

    } catch (error) {
        console.error("Restore error:", error);
        return NextResponse.json(
            { error: "Failed to restore file" },
            { status: 500 }
        );
    }
}