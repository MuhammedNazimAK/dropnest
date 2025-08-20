// in app/api/user/storage/route.ts
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const result = await db.select({
        totalSize: sum(files.size)
    }).from(files).where(
        and(
            eq(files.userId, userId),
            eq(files.isFolder, false)
        )
    );

    const totalStorage = Number(result[0]?.totalSize) || 0;

    return NextResponse.json({ totalStorage });
}