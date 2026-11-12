/** @type {import('next').NextConfig} */
// EXPORT=1 builds a plain static site in ./out (used for Firebase Hosting).
const isExport = process.env.EXPORT === "1";
const nextConfig = isExport
  ? {
      output: "export",
      images: { unoptimized: true },
      // Relative asset paths, only needed when previewing from a sub-folder
      ...(process.env.RELATIVE_ASSETS === "1" ? { assetPrefix: "./" } : {}),
    }
  : {};
export default nextConfig;
