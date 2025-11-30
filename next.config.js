/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [
      // Canonicalize query-based tabs to path-based tabs
      {
        source: '/dashboard',
        has: [{ type: 'query', key: 'tab', value: 'overview' }],
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard',
        has: [{ type: 'query', key: 'tab', value: '(?<tab>.+)' }],
        destination: '/dashboard/:tab',
        permanent: true,
      },
      // Avoid duplicate route for overview
      {
        source: '/dashboard/overview',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}
module.exports = nextConfig
