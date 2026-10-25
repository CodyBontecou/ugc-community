import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Keep every platform's icon in sync with the editable brand artwork.
const source = await readFile(new URL("../public/brand/icon.svg", import.meta.url));
const root = new URL("../", import.meta.url);

await sharp(source).resize(512, 512).png().toFile(new URL("app/icon.png", root).pathname);

// Apple applies its own corner mask; extend the gradient through the corners.
const appleSource = Buffer.from(source.toString().replace('rx="112"', 'rx="0"'));
await sharp(appleSource).resize(180, 180).png().toFile(new URL("app/apple-icon.png", root).pathname);

// An ICO directory with PNG entries covers legacy /favicon.ico requests too.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => sharp(source).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL("app/favicon.ico", root), Buffer.concat([header, ...images]));
