import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

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

    // Parse form data
    const formData = await request.formData();
    const uploadFiles = formData.getAll("files") as File[]; // Multiple files
    const parentId = formData.get("parentId") as string || null;

    if (!uploadFiles || uploadFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate parent folder if provided
    if (parentId) {
      const [parentFolder] = await db.select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );

      if (!parentFolder) {
        return NextResponse.json({ error: "Invalid parent folder" }, { status: 400 });
      }
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of uploadFiles) {
      try {

        const allowedTypes = [
          'image/', 'application/pdf', 'text/', 'application/json',
          'application/zip', 'video/', 'audio/', 'application/msword',
          'application/vnd.openxmlformats-officedocument'
        ];

        const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));

        if (!isAllowedType) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        // File size validation (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          errors.push(`${file.name}: File too large (max 50MB)`);
          continue;
        }

        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        const folderPath = parentId ? `/dropnest/${userId}/folder/${parentId}` : `/dropnest/${userId}`;
        const originalName = file.name;
        const fileExtension = originalName.split(".").pop() || "";
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        // Upload to ImageKit
        const uploadResponse = await imageKit.upload({
          file: fileBuffer,
          fileName: uniqueFileName,
          folder: folderPath,
          useUniqueFileName: false
        });

        // Save to database
        const fileData = {
          name: originalName,
          path: uploadResponse.filePath,
          size: file.size,
          type: file.type,
          fileUrl: uploadResponse.url,
          thumbnailUrl: uploadResponse.thumbnailUrl || null,
          fileIdInImageKit: uploadResponse.fileId,
          userId: userId,
          parentId: parentId,
          isFolder: false,
          isStarred: false,
          isTrash: false,
        };

        const [newFile] = await db.insert(files).values(fileData).returning();
        uploadedFiles.push(newFile);

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    return NextResponse.json({
      success: true,
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
