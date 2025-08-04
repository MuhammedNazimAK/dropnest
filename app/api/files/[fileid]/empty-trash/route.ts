import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";


const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
})  

export async function DELETE() {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({error: "Unauthorized"},
        {status: 401}
      )
    }

    //find
    const trashedFiles = await db.select().from(files).where(and (eq(files.isTrash, true), eq(files.userId, userId)));

    // delete from image kit
    await Promise.all(
      trashedFiles.map(async (file) => {
        if (file.fileIdInImageKit) {
          try {
            await imageKit.deleteFile(file.fileIdInImageKit);
          } catch (error) {
            console.error(`Failed to delete from ImageKit for file ${file.id}`, error);
          }
        }
      })
    );

    // delete from db
    await db.delete(files).where( and(
      eq(files.isTrash, true),
      eq(files.userId, userId)
    ))

    return NextResponse.json({ success: true, message: "Trash emptied" });

  } catch (error) {
     console.error("Error emptying trash:", error);
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
    
  }
}