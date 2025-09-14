import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";
import { deleteFilesService } from "@/lib/services/file.service"; // Import the service
import { getErrorMessage } from "@/utils/errorHandler";
import { getIdFromRequest } from "@/utils/requestHelpers";


const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});


export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const fileId = getIdFromRequest(request, "files");
        if (!fileId) {
            return NextResponse.json({ error: "File ID is required" }, { status: 400 });
        }

        // Call the service function with the single ID
        const { deletedDbIds } = await deleteFilesService(
            [fileId], // Pass the ID in an array
            userId,
            db,
            imageKit
        );

        return NextResponse.json({
            success: true,
            message: "Item(s) deleted permanently.",
            deletedIds: deletedDbIds,
        });

    } catch (error) {
        console.error("Error during permanent deletion:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}