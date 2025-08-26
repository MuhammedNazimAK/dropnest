import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }

        const searchResults = await db.select()
            .from(files)
            .where(
                and(
                    eq(files.userId, userId),
                    eq(files.isTrash, false),
                    ilike(files.name, `%${query}%`) // Case-insensitive search
                )
            )
            .orderBy(files.updatedAt)
            .limit(50); // Limit to prevent huge responses

        return NextResponse.json(searchResults);

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}