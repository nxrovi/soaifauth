/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Ensure Turbopack picks this project as the root when multiple lockfiles exist
    root: __dirname,
  },
  // Enable IP address detection
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

