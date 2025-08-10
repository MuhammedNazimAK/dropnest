import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";


const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
})

export async function DELETE(request: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fileId } = await props.params;
    if (!fileId) {
      return NextResponse.json({ error: "file ID is required" },
        { status: 400 }
      )
    }

    console.log("passed file id check")

    const [file] = await db.select().from(files).where(
      and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      )
    )
    if (!file) {
      return NextResponse.json({ error: "file not found" },
        { status: 404 }
      )
    }

    // delete from imagekit
    if (file.fileIdInImageKit) {
      try {
        await imageKit.deleteFile(file.fileIdInImageKit);
      } catch (error) {
        console.error(`[DELETE /files] ImageKit deletion failed for fileIdInImageKit=${file.fileIdInImageKit}:`, error);
        return NextResponse.json({ error: "Failed to delete from ImageKit" }, { status: 500 });
      }
    }

    // delete from db
    await db.delete(files).where(and(eq(files.id, fileId), eq(files.userId, userId)))

    return NextResponse.json({ success: true, message: "File deleted successfully" });

  } catch (error) {
    console.log("DELETE file error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}