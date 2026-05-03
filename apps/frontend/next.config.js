/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,  // Clear old entries every 25 sec
    pagesBufferLength: 2,        // Keep only 2 pages in memory
  },
}

module.exports = nextConfig