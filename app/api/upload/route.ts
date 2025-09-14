/**
 * DEPRECATED — Client-side ImageKit upload metadata handler
 *
 * This route was used when files were uploaded directly from the frontend to ImageKit.
 *
 * Currently handling uploads server-side, so this route is not in use.
 * Kept for future reference if switching back to client-side uploads with signed URLs.
 */


// import { auth } from "@clerk/nextjs/server";
// import { db } from "@/lib/db";
// import { files } from "@/lib/db/schema";
// import { NextRequest, NextResponse } from "next/server";


// export async function POST(request: NextRequest) {
//   try {
    
//     const {userId} = await auth();

//     if (!userId) {
//       return NextResponse.json({error: "Unauthorized"}, 
//         {status: 401}
//       );
//     }

//     const body = await request.json();

//     const { imagekit, userId: bodyUserId } = body;

//     if (bodyUserId !== userId) {
//       return NextResponse.json({error: "Unauthorized"},
//         {status: 401}
//       );
//     }

//     if (!imagekit || !imagekit.url) {
//       return NextResponse.json({error: "Invalid file upload data"}, 
//         { status: 401 }
//       );
//     }

//     const fileData = {
//       name: imagekit.name || "Untitled",
//       path: imagekit.filePath || `/dropnest/${userId}/${imagekit.name}`,
//       size: imagekit.size || 0,
//       type: imagekit.fileType || "image",
//       fileUrl: imagekit.url,
//       thumbnailUrl: imagekit.thumbnailUrl || null,
//       fileIdInImageKit: imagekit.fileId,
//       userId: userId,
//       parentId: null, 
//       isFolder: false,
//       isStored: false,
//       isTrash: false,
//     }

//     const [newFile] = await db.insert(files).values(fileData).returning();

//     return NextResponse.json(newFile);

//   } catch (error) {

//     console.log(error)

//     return NextResponse.json({ error: "Failed to save the info to database" },
//         { status: 500 }
//       )
//   }
// }

export {};