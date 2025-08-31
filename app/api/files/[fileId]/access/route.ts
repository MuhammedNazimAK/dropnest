import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { fileId: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fileId } = params;
        if (!fileId) {
            return NextResponse.json({ error: "File ID is required" }, { status: 400 });
        }

        // Verify ownership before updating.
        // This prevents a user from updating metadata for a file they don't own.
        await db.update(files)
            .set({ lastAccessedAt: new Date() })
            .where(and(eq(files.id, fileId), eq(files.userId, userId)));

        // Return a 200 OK response. dont need to send any data back.
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[PUT /api/files/access] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}