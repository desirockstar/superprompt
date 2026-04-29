/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  imageLoader: 'cloudflare',
}

const withCloudflare = require('@cloudflare/next-on-pages')(nextConfig)
module.exports = withCloudflare