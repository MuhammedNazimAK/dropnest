import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";
import { moveFileService } from "@/lib/services/file.service";
import { getErrorMessage } from "@/utils/errorHandler";
import { getIdFromRequest } from "@/utils/requestHelpers";


const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});


export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const fileId = getIdFromRequest(request, "files");
        if (!fileId) {
            return NextResponse.json({ error: "File ID is required" }, { status: 400 });
        }

        const { targetFolderId }: { targetFolderId: string | null } = await request.json();

        const updatedFile = await moveFileService(fileId, targetFolderId, userId, db, imageKit);

        return NextResponse.json({
            success: true,
            message: `Moved "${updatedFile.name}" successfully`,
            file: updatedFile,
        });

    } catch (error) {
        console.error("Error moving file:", error);
        return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
    }
}