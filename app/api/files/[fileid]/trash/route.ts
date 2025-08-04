import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(request: NextRequest, props: {params: Promise<{fileId: string}>}) {
  try {

    const {userId} = await auth();
    if (!userId) {
      return NextResponse.json({error: "Unauthorized"},
        {status: 401}
      )
    }

    const { fileId } = await props.params;
    if (!fileId) {
      return NextResponse.json({error: "file id is requried"},
        {status: 500}
      )
    }

    const [file] = await db.select().from(files).where(
            and(
              eq(files.id, fileId),
              eq(files.userId, userId)
            )
    )

    if (!file) {
      return NextResponse.json({error: "file not found"},
        {status: 500}
      )
    }

    //toggle the trash status
    const updatedFiles = await db.update(files).set({isTrash: !file.isTrash}).where(
      and(
        eq(files.id, fileId),
        eq(files.userId, userId)
      )
    ).returning()

    console.log("updated files from trash", updatedFiles);

    const updatedFile = updatedFiles[0];

    return NextResponse.json(updatedFile);

    
  } catch (error) {
    console.log(error);

    return NextResponse.json({error: "failed to update the files"},
      {status: 500}
    )
  }  
}