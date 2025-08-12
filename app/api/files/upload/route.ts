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

    const parentIdValue = formData.get("parentId") as string;
    const parentId = (parentIdValue && parentIdValue !== 'null') ? parentIdValue : null;

    
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

        console.log(`Uploading '${file.name}' to ImageKit folder: ${folderPath}`);

        // Upload to ImageKit
        const uploadResponse = await imageKit.upload({
          file: fileBuffer,
          fileName: file.name,
          folder: folderPath,
          useUniqueFileName: true
        });

        console.log("ImageKit Upload Response:", JSON.stringify(uploadResponse, null, 2));

        if (!uploadResponse || !uploadResponse.fileId) {
            console.error("!!! FAILED to get fileId from ImageKit response for file:", file.name);
            // Skip this file if the response is invalid
            continue; 
        }

        // Save to database
        const fileData = {
          name: uploadResponse.name,
          path: uploadResponse.filePath,
          size: uploadResponse.size,
          type: uploadResponse.fileType,
          fileUrl: uploadResponse.url,
          thumbnailUrl: uploadResponse.thumbnailUrl || null,
          fileIdInImageKit: uploadResponse.fileId,
          userId: userId,
          parentId: parentId,
          isFolder: false,
          isStarred: false,
          isTrash: false,
        };

        console.log("Preparing to insert into DB:", JSON.stringify(fileData, null, 2));

        const [newFile] = await db.insert(files).values(fileData).returning();
        uploadedFiles.push(newFile);

        console.log(`Successfully inserted DB record for fileId: ${newFile.id}`);

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
