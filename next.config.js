/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Ensure all pages are included in the build output
  output: 'standalone',
  async redirects() {
    return [
      // Redirect old dashboard routes to /admin
      {
        source: '/dashboard',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
      {
        source: '/modern-dashboard',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/modern-dashboard/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
    ]
  },
}
module.exports = nextConfig
