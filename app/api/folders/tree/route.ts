import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export interface FolderTreeNode {
  id: string;
  name: string;
  children: FolderTreeNode[];
}

// Helper function to build the tree from a flat list of folders
const buildTree = (folders: any[], parentId: string | null = null): FolderTreeNode[] => {
  return folders
    .filter(folder => folder.parentId === parentId)
    .map(folder => ({
      id: folder.id,
      name: folder.name,
      children: buildTree(folders, folder.id),
    }));
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch ALL folders for the user in one go
    const allUserFolders = await db.query.files.findMany({
      where: and(
        eq(files.userId, userId),
        eq(files.isFolder, true),
        eq(files.isTrash, false)
      ),
      columns: {
          id: true,
          name: true,
          parentId: true
      }
    });

    // Build the hierarchical tree on the server
    const folderTree = buildTree(allUserFolders);

    // Create a root node to represent the "Home" directory
    const rootNode: FolderTreeNode = {
      id: 'root', // A special ID for the root
      name: 'Home',
      children: folderTree,
    };

    return NextResponse.json([rootNode]);

  } catch (error) {
    console.error("Failed to fetch folder tree:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}