/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  output: 'standalone',
  transpilePackages: ['fabric', 'html2canvas', 'html-to-image'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'kaburlu-news.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.kaburlumedia.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
  },
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
      {
        source: '/admin/tenants/:id/branding',
        destination: '/admin/tenants/:id/domain-settings',
        permanent: false,
      },
      {
        source: '/admin/tenants/:id/seo',
        destination: '/admin/tenants/:id/domain-settings',
        permanent: false,
      },
      {
        source: '/admin/tenants/:id/homepage',
        destination: '/admin/tenants/:id/domain-settings',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig
