import { db, type DrizzleDB } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { v4 as uuidv4 } from 'uuid';
import { lookup } from 'mime-types'; 

interface DemoItemBase {
    name: string;
    type: 'folder' | 'file';
}

interface DemoFile extends DemoItemBase {
    type: 'file';
    url: string;
}

interface DemoFolder extends DemoItemBase {
    type: 'folder';
    children?: readonly DemoItem[];
}

type DemoItem = DemoFile | DemoFolder;

const DEMO_STRUCTURE = [
    {
        name: "Photos",
        type: "folder",
        children: [
            {
                name: "Wallpaper",
                type: "folder",
                children: [
                    { name: "wallpaper-1.jpg", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/pexels-life-of-pix-7919_P-AZIT88w.jpg?updatedAt=1758144544903" },
                    { name: "wallpaper-2.jpg", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/pexels-souvenirpixels-1519088_vB0_2l6qh.jpg?updatedAt=1758144666196" }
                ]
            },
            { name: "photo-1.jpg", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/pexels-48393-356269_oarii8oGkG.jpg?updatedAt=1758144816602" },
            { name: "photo-2.jpg", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/pexels-abby-chung-371167-1191377_ppvfKoQxR.jpg?updatedAt=1758144818150" }
        ]
    },
    // {
    //     name: "Videos",
    //     type: "folder",
    //     children: [
    //         { name: "beach-sunset.mp4", type: "file", url: "YOUR_BEACH_VIDEO_URL" },
    //         { name: "mountain-hike.mov", type: "file", url: "YOUR_MOUNTAIN_VIDEO_URL" }
    //     ]
    // },
    {
        name: "Music",
        type: "folder",
        children: [
            { name: "music-1.mp3", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/synthwave-retro-80s-321106_Bb2y5iP1L.mp3?updatedAt=1758145757447" },
            { name: "music-2.mp3", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/synthwave-80s-retro-background-music-400483_A4uRHcsCo.mp3?updatedAt=1758145790446" },
        ]
    },
    {
        name: "Documents",
        type: "folder",
        children: [
            { name: "project-1.pdf", type: "file", url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/file-example_PDF_500_kB_Zkr2DSaXq.pdf?updatedAt=1758150092805" },
        ]
    },
    {
        name: "read-me.txt",
        type: "file",
        url: "https://ik.imagekit.io/f7zscmh4c/dropnest/user_32qMMrlaxPXmePcKCp0boe0lytI/sample1_HSPHDJBNm.txt?updatedAt=1758149879793"
    },
] as const;


const imageKitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ""
});

export async function resetDemoAccount() {

    const demoUserId = process.env.DEMO_USER_ID;
    if (!demoUserId) throw new Error("DEMO_USER_ID is not set.");

    const existingFiles = await db.select({
        id: files.id,
        fileIdInImageKit: files.fileIdInImageKit
    }).from(files).where(eq(files.userId, demoUserId));

    if (existingFiles.length > 0) {

        const imageKitFileIds = existingFiles.map(f => f.fileIdInImageKit);

        const validFileIdsToDelete = imageKitFileIds.filter((id): id is string => {
            return id !== null && id !== undefined && id !== '';
        });

        if (validFileIdsToDelete.length > 0) {
            await imageKitClient.bulkDeleteFiles(validFileIdsToDelete);
        }

        await db.delete(files).where(eq(files.userId, demoUserId));
    }

    await seed(db, demoUserId, DEMO_STRUCTURE);
}


async function seed(db: DrizzleDB, userId: string, items: readonly DemoItem[], parentId: string | null = null) {

    for (const item of items) {
        const newId = uuidv4();

        if (item.type === "folder") {
            let parentPath = '';
            if (parentId) {
                const parentFolder = await db.query.files.findFirst({
                    where: eq(files.id, parentId),
                    columns: { path: true }
                });
                parentPath = parentFolder?.path || '';
            }

            const newPath = parentId ? `${parentPath}/${newId}` : newId;

            await db.insert(files).values({
                id: newId,
                name: item.name,
                userId: userId,
                isFolder: true,
                parentId: parentId,
                path: newPath,
                fileUrl: '',
                thumbnailUrl: '',
                fileIdInImageKit: '',
                size: 0,
                type: 'folder',
                lastAccessedAt: null,
            });

            if (item.children) {
                await seed(db, userId, item.children, newId);
            }
        } else if (item.type === "file") {
            const uploadResponse = await imageKitClient.upload({
                file: item.url,
                fileName: item.name,
                folder: `/dropnest/${userId}/${parentId || ''}`,
                useUniqueFileName: false,
                responseFields: ["metadata"]
            });

            const mimeType = lookup(uploadResponse.name) || 'application/octet-stream';

            await db.insert(files).values({
                id: newId,
                name: uploadResponse.name,
                userId: userId,
                isFolder: false,
                parentId: parentId,
                path: uploadResponse.filePath,
                fileUrl: uploadResponse.url,
                thumbnailUrl: uploadResponse.thumbnailUrl,
                fileIdInImageKit: uploadResponse.fileId,
                size: uploadResponse.size,
                type: mimeType,
                lastAccessedAt: null,
            });
        }
    }
}