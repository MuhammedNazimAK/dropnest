import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";
import { moveFileService } from "@/lib/services/file.service";


const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});


export async function PATCH(request: NextRequest, { params }: { params: { fileId: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fileId: fileIdToMove } = params;
        const { targetFolderId }: { targetFolderId: string | null } = await request.json();

        const updatedFile = await moveFileService(fileIdToMove, targetFolderId, userId, db, imageKit);

        return NextResponse.json({
            success: true,
            message: `Moved "${updatedFile.name}" successfully`,
            file: updatedFile,
        });

    } catch (error: any) {
        console.error("Error moving file:", error);
        return NextResponse.json({ message: error.message || "Failed to move file" }, { status: 500 });
    }
}