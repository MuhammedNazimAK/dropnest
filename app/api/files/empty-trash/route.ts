import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";
import { deleteFilesService } from "@/lib/services/file.service";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
})  

export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        // Step 1: Find all trashed items for the user
        const trashedItems = await db.select({ id: files.id })
            .from(files)
            .where(and(eq(files.isTrash, true), eq(files.userId, userId)));

        if (trashedItems.length === 0) {
            return NextResponse.json({ success: true, message: "Trash is already empty." });
        }

        // Step 2: Collect the IDs of the trashed items
        const trashedItemIds = trashedItems.map(item => item.id);

        // Step 3: Call the delete service with these IDs
        await deleteFilesService(trashedItemIds, userId, db, imageKit);

        return NextResponse.json({ success: true, message: "Trash emptied successfully" });

    } catch (error) {
        console.error("Error emptying trash:", error);
        return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
    }
}