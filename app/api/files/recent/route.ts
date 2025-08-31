import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, desc, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

const RECENT_FILES_LIMIT = 5;

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const recentFiles = await db.query.files.findMany({
            where: and(
                eq(files.userId, userId),
                eq(files.isTrash, false),
                isNotNull(files.lastAccessedAt) // Only show files that have been accessed at least once
            ),
            orderBy: desc(files.lastAccessedAt),
            limit: RECENT_FILES_LIMIT,
        });
        
        return NextResponse.json(recentFiles);

    } catch (error) {
        console.error("[GET /api/files/recent] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}