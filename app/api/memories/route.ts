
import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";




const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export async function GET() {
  try {
    const photosDirectory = path.join(
      process.cwd(),
      "public",
      "photos"
    );

    const files = await readdir(photosDirectory, {
      withFileTypes: true,
    });

    const photos = files
      .filter(
        (file) =>
          file.isFile() &&
          supportedExtensions.has(
            path.extname(file.name).toLowerCase()
          )
      )
      .map((file) => file.name)
      .sort((a, b) =>
        a.localeCompare(a, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

    const memories = photos.map((filename, index) => ({
      id: String(index + 1),
      title: `Memory ${index + 1}`,
      description: `A special moment from our story.`,
      image: `/photos/${encodeURIComponent(filename)}`,
    }));

    return NextResponse.json(
      { memories, total: memories.length },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Could not load museum photos:", error);

    return NextResponse.json(
      {
        memories: [],
        total: 0,
        error:
          "Could not read public/photos. Check that the folder exists.",
      },
      { status: 500 }
    );
  }
}
