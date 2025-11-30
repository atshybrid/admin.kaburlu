import Head from 'next/head'
import { useRouter } from 'next/router'
import Dashboard from '../dashboard'

export default function DashboardTabPage({ initialTab, canonicalUrl }) {
  const router = useRouter()
  const tab = initialTab || (typeof router.query?.tab === 'string' ? router.query.tab : undefined)
  return (
    <>
      <Head>
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Dashboard initialTab={tab} />
    </>
  )
}

export async function getServerSideProps(ctx) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const allowed = [
    'overview',
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
  const param = String(ctx.params?.tab || '').trim()
  const lower = param.toLowerCase()
  if (!allowed.includes(lower)) {
    return {
      redirect: { destination: '/dashboard', permanent: false }
    }
  }
  if (param !== lower) {
    return {
      redirect: { destination: `/dashboard/${lower}`, permanent: true }
    }
  }
  return {
    props: {
      initialTab: lower,
      canonicalUrl: `${site}/dashboard/${lower}`,
    }
  }
}
