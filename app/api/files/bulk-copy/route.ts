import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";
import { copyFilesService } from "@/lib/services/file.service";
import { getErrorMessage } from "@/utils/errorHandler";

const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
})

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { itemIds, targetFolderId }: { itemIds: string[], targetFolderId: string | null } = await request.json();
        
        if (!itemIds || itemIds.length === 0) {
            return NextResponse.json({ error: "No items to copy." }, { status: 400 });
        }

        // Process all copy operations concurrently
        const copyPromises = itemIds.map(id => 
            copyFilesService(id, targetFolderId, userId, db, imageKit)
        );
        
        // This will contain the array of newly created file records
        const newFiles = await Promise.all(copyPromises);

        return NextResponse.json({
            success: true,
            message: `Copied ${itemIds.length} item(s) successfully.`,
            files: newFiles, // Return the new file data
        });

    } catch (error) {
        console.error("Error during bulk copy:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}