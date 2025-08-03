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
        const formUserId = formData.get("userId") as string
        const parentId = formData.get("parentId") as string || null

        if (formUserId !== userId) {
          return NextResponse.json({ error: "Unauthorized" },
            { status: 401 }
          )
        }

        
    
  } catch (error) {
   console.log(error);
   
  }
}