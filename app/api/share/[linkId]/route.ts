import { db } from "@/lib/db";
import { sharedLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest, { params }: { params: { linkId: string } }) {
  try {
    const { linkId } = params;
    
    const link = await db.query.sharedLinks.findFirst({
      where: eq(sharedLinks.id, linkId),
      with: {
        file: true, // Use the relation to fetch the associated file data!
      },
    });

    if (!link || !link.file) {
      return NextResponse.json({ error: "Link not found or has expired" }, { status: 404 });
    }
    
    // IMPORTANT: Only return the data needed for the public page.
    // Do NOT expose sensitive info like userId, etc.
    const publicFileData = {
      name: link.file.name,
      type: link.file.type,
      size: link.file.size,
      fileUrl: link.file.fileUrl,
    };
    
    return NextResponse.json(publicFileData);
  } catch (error) {
    // ... error handling
  }
}