/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/:path*`,
      },
    ];
  },
};

export default nextConfig;
