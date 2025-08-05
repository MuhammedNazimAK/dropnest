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
})


export async function POST(request: NextRequest) {
  try {

    const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" },
            { status: 401 }
          )
        }

        // parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File
        const parentId = formData.get("parentId") as string || null

        if (!file) {
          return NextResponse.json({error: "No file provided"},
            {status: 401}
          )
        }

        if (parentId) {
          const [parentFolder] = await db.select()
                  .from(files)
                  .where(
                    and(
                      eq(files.id, parentId),
                      eq(files.userId, userId),
                      eq(files.isFolder, true)
                    )
                  )

          if (!parentFolder) {
          return NextResponse.json({ error: "Invalid parent folder" }, { status: 401 });
        }
      }

        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          return NextResponse.json({error: "only image and pdf are supported"},
            {status: 415}
          )
        }

        const buffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)

        const folderPath = parentId ? `/dropnest/${userId}/folder/${parentId}` : `/dropnest/${userId}`

        const originalName = file.name;
        const fileExtension = originalName.split(".").pop() || ""


        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        const uploadResponse = await imageKit.upload({
          file: fileBuffer,
          fileName: uniqueFileName,
          folder: folderPath,
          useUniqueFileName: false
        })

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
        }

        const [NewFile] = await db.insert(files).values(fileData).returning();

        return NextResponse.json(NewFile);
    
  } catch (error) {
   console.log(error);
   return NextResponse.json({error: "failed to upload file"},
    {status: 500}
   )
  }
}