
import fs from "node:fs";
import path from "node:path";

const photoDirectory = path.join(process.cwd(), "public", "photos");
const outputFile = path.join(process.cwd(), "public", "memories.json");

const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

if (!fs.existsSync(photoDirectory)) {
  console.error("ERROR: public/photos folder was not found.");
  process.exit(1);
}

const files = fs
  .readdirSync(photoDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) =>
    supportedExtensions.has(path.extname(name).toLowerCase())
  )
  .sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

const memories = files.map((file, index) => ({
  id: index + 1,
  title: `Memory ${index + 1}`,
  date: "",
  description: "A little moment from our story.",
  image: `/photos/${encodeURIComponent(file)}`,
}));

fs.writeFileSync(outputFile, JSON.stringify(memories, null, 2), "utf8");

console.log(`Done! Found ${memories.length} photos.`);
console.log(`Created: public/memories.json`);

if (memories.length === 0) {
  console.warn("No supported photos found. Check your photo folder.");
}
