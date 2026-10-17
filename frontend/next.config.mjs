/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aplikasi Puskesmas dibangun menjadi file statis (folder out/) yang disajikan
  // langsung oleh backend di http://localhost:8000. Tidak butuh Node.js atau internet saat dipakai.
  output: "export",
  trailingSlash: true,
  // cacheComponents/partialPrefetching tidak didukung pada output "export", jadi dimatikan.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
