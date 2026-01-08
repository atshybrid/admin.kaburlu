/**
 * Modern Dashboard Tab Route
 * Handles /modern-dashboard/[tab] routes
 */

import Head from 'next/head'
import { useRouter } from 'next/router'
import ModernDashboard from '../modern-dashboard'

// Allowed tabs list (must match parent)
const ALLOWED_TABS = [
  'overview',
  'articles',
  'tenants',
  'reporters',
  'users',
  'categories',
  'languages',
  'states',
  'districts',
  'assembly',
  'mandals',
  'roles',
  'tenant-idcard-settings',
  'tenant-razorpay-settings',
  'global-razorpay-settings',
  'tenant-domain-settings',
]

export default function ModernDashboardTabPage({ initialTab, canonicalUrl }) {
  const router = useRouter()
  const tab = initialTab || (typeof router.query?.tab === 'string' ? router.query.tab : 'overview')

  return (
    <>
      <Head>
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ModernDashboard initialTab={tab} />
    </>
  )
}

export async function getServerSideProps(ctx) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const param = String(ctx.params?.tab || '').trim()
  const lower = param.toLowerCase()

  // Redirect invalid tabs
  if (!ALLOWED_TABS.includes(lower)) {
    return {
      redirect: { destination: '/modern-dashboard', permanent: false }
    }
  }

  // Redirect non-lowercase to lowercase
  if (param !== lower) {
    return {
      redirect: { destination: `/modern-dashboard/${lower}`, permanent: true }
    }
  }

  return {
    props: {
      initialTab: lower,
      canonicalUrl: `${site}/modern-dashboard/${lower}`,
    }
  }
}
