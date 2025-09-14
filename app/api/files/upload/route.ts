import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { getErrorMessage } from "@/utils/errorHandler";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    // Client sends one file per request, so we use .get()
    const file = formData.get("files") as File | null;

    const parentIdValue = formData.get("parentId") as string;
    const parentId = (parentIdValue && parentIdValue !== 'null') ? parentIdValue : null;

    if (!file) {
      return NextResponse.json({ error: "No file provided in the request" }, { status: 400 });
    }

    let imageKitFolderPath = `/dropnest/${userId}`;

    if (parentId) {
      const parentFolder = await db.query.files.findFirst({
        where: and(eq(files.id, parentId), eq(files.userId, userId), eq(files.isFolder, true)),
        columns: { path: true }
      });

      if (!parentFolder) {
        return NextResponse.json({ error: "Invalid parent folder" }, { status: 400 });
      }

      imageKitFolderPath = `/dropnest/${userId}/${parentFolder.path}`;
    }

    const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/json', 'application/zip', 'application/x-zip-compressed', 'video/', 'audio/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File too large (max 50MB)`);
    }

    const buffer = await file.arrayBuffer();

    const uploadResponse = await imageKit.upload({
      file: Buffer.from(buffer),
      fileName: file.name,
      folder: imageKitFolderPath.replace(/\/+/g, '/').replace(/\/$/, ''),
      useUniqueFileName: true
    });

    if (!uploadResponse || !uploadResponse.fileId) {
      throw new Error("ImageKit upload response was invalid.");
    }

    const fileData = {
      name: uploadResponse.name,
      path: uploadResponse.filePath,
      size: uploadResponse.size,
      type: file.type,
      fileUrl: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || null,
      fileIdInImageKit: uploadResponse.fileId,
      userId: userId,
      parentId: parentId,
      isFolder: false, isStarred: false, isTrash: false,
    };

    const [newlyCreatedFile] = await db.insert(files).values(fileData).returning();

    return NextResponse.json({
      success: true,
      uploadedFiles: [newlyCreatedFile],
    });

  } catch (error) {

    console.error("Upload failed for a file:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}