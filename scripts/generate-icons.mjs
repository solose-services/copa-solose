import sharp from "sharp";
import { mkdirSync } from "node:fs";

const src = "fut_club_solose.jpeg";
const outDir = "public/icons";
mkdirSync(outDir, { recursive: true });

async function squareCover(size) {
  return sharp(src)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

async function main() {
  await sharp(await squareCover(192)).toFile(`${outDir}/icon-192.png`);
  await sharp(await squareCover(512)).toFile(`${outDir}/icon-512.png`);
  await sharp(await squareCover(180)).toFile(`${outDir}/apple-touch-icon.png`);

  // Maskable: ~14% safe-area margin, logo centered on white so Android's
  // circular/rounded crop never clips the crest.
  const inner = Math.round(512 * 0.72);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: "#FFFFFF" },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(`${outDir}/icon-512-maskable.png`);

  console.log("Icons generated in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
