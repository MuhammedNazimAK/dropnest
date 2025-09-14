import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";
import { moveFileService } from "@/lib/services/file.service";
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
            return NextResponse.json({ error: "No items to move." }, { status: 400 });
        }

        // Process all move operations concurrently
        const movePromises = itemIds.map(id =>
            moveFileService(id, targetFolderId, userId, db, imageKit)
        );

        await Promise.all(movePromises);

        return NextResponse.json({
            success: true,
            message: `Moved ${itemIds.length} item(s) successfully.`,
        });

    } catch (error) {
        console.error("Error during bulk move:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}