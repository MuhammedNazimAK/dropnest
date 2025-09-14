import { db } from "@/lib/db";
import { files, sharedLinks } from "@/lib/db/schema";
import { getIdFromRequest } from "@/utils/requestHelpers";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const fileId = getIdFromRequest(request, "files");
        if (!fileId) {
            return NextResponse.json({ error: "File ID is required" }, { status: 400 });
        }

        // Verify the user actually owns the file they're trying to share
        const file = await db.query.files.findFirst({
            where: and(eq(files.id, fileId), eq(files.userId, userId))
        });

        if (!file) {
            return NextResponse.json({ error: "File not found or access denied." }, { status: 404 });
        }

        // Check if a link already exists for this file to avoid creating duplicates
        let existingLink = await db.query.sharedLinks.findFirst({
            where: and(eq(sharedLinks.fileId, fileId), eq(sharedLinks.userId, userId))
        });

        // If no link exists, create one
        if (!existingLink) {
            [existingLink] = await db.insert(sharedLinks).values({
                fileId: fileId,
                userId: userId,
                // You could add expiration logic here based on user input
            }).returning();
        }

        // Construct the full, shareable URL
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${existingLink.id}`;

        return NextResponse.json({ success: true, url: shareUrl });
    } catch (error) {

        console.error("Error creating share link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}