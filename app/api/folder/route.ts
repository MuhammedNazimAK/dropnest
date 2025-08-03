import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
 
export async function POST(request: NextResponse) {
  try {
    
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({error: "Unauthorized"},
        {status: 401}
      );
    }

    const body = await request.json();

    const { name, parentId = null, userId: bodyUserId } = body;

    if (bodyUserId !== userId) {
      return NextResponse.json({error: "Unauthorized"},
        { status: 401 }
      );
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({error: "folder name is required"},
        { status: 400}
      );
    } 

    if (parentId) {
     const [parentFolder] = await db
          .select()
          .from(files)
          .where(
            and(
              eq(files.id, parentId),
              eq(files.userId, userId),
              eq(files.isFolder, true)
            )
          )

          if (!parentFolder) {
            return NextResponse.json({ error: "parent folder not found"}, 
              { status: 401 }
            )
          }
    }

    //crate a folder in database
    const folderData = {
      id: uuidv4(),
      name: name.trim(),
      path: `/folders/${userId}/${uuidv4()}`,
      size: 0,
      type: "folder",
      fileUrl: "",
      thumbnailUrl: null,
      userId,
      parentId,
      isFolder: true,
      isStarred: false,
      isTrash: false
    }

    const [newFolder] = await db.insert(files).values(folderData).returning();

    return NextResponse.json({ success: true, message: "Folder successfully created", folder: newFolder });

  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "failed to create the folder"}, 
      {status: 500}
    )
  }
}
