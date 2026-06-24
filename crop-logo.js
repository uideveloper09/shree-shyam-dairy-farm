const sharp = require("sharp");

async function cropLogo() {
  await sharp("./public/logos/logo.png")
    .trim()
    .png()
    .toFile("./public/logos/logo-cropped.png");

  console.log("✅ Logo cropped successfully");
}

cropLogo().catch(console.error);