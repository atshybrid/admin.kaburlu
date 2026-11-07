/**
 * Step-by-step tenant onboarding checklist — start to live domain
 */
import Link from 'next/link'

const STEPS = [
  {
    id: 'entity',
    label: '1. Entity Registration',
    tab: 'entity',
    check: (ctx) => !!ctx?.entity?.id,
    hint: 'PRGI details, native name, language',
  },
  {
    id: 'domains',
    label: '2. Add NEWS Domain',
    tab: 'domains',
    check: (ctx) => (ctx?.domains || []).some((d) => d.kind === 'NEWS' || !d.domain?.startsWith('epaper.')),
    hint: 'e.g. prashnaayudham.com — verify domain',
  },
  {
    id: 'domain-settings',
    label: '3. Domain Theme & SEO',
    tab: 'domain-settings',
    check: (ctx) => (ctx?.domains || []).some((d) => d.status === 'ACTIVE'),
    hint: 'Logo, colors, navigation, SEO per domain',
  },
  {
    id: 'categories',
    label: '4. Categories',
    tab: 'categories',
    check: (ctx) => (ctx?.categories || []).length > 0,
    hint: 'Allocate content categories',
  },
  {
    id: 'homepage',
    label: '5. Homepage Layout',
    tab: 'homepage',
    check: () => false,
    hint: 'Style1/2/3 smart homepage sections',
  },
  {
    id: 'ads',
    label: '6. Advertisement Slots',
    tab: 'ads',
    check: () => false,
    hint: 'Banner slots + AdSense client ID',
  },
  {
    id: 'admins',
    label: '7. Tenant Admin User',
    tab: 'admins',
    check: () => false,
    hint: 'Create login for newspaper owner',
  },
  {
    id: 'approve',
    label: '8. Approve & Go Live',
    tab: 'overview',
    check: (ctx) => {
      const d = (ctx?.domains || []).find((x) => x.status === 'ACTIVE' && !x.domain?.startsWith('epaper.'))
      return !!d && !!ctx?.entity
    },
    hint: 'PRGI verify + point DNS to server',
  },
]

export default function TenantOnboardingGuide({ tenantId, tenantContext }) {
  const completed = STEPS.filter((s) => s.check(tenantContext)).length
  const pct = Math.round((completed / STEPS.length) * 100)
  const primaryDomain = (tenantContext?.domains || []).find(
    (d) => !d.domain?.startsWith('epaper.') && d.status === 'ACTIVE',
  )

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Tenant Setup Guide</h3>
          <p className="text-xs text-slate-500 mt-0.5">Complete all steps before going live</p>
        </div>
        <span className="text-lg font-bold text-brand">{pct}%</span>
      </div>

      <div className="h-2 bg-white rounded-full overflow-hidden mb-4 border">
        <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ol className="space-y-2">
        {STEPS.map((step) => {
          const done = step.check(tenantContext)
          return (
            <li key={step.id}>
              <Link
                href={`/admin/tenants/${tenantId}/${step.tab}`}
                className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                  done
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-brand/40'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {done ? '✓' : '○'}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{step.label}</p>
                  <p className="text-xs text-slate-500">{step.hint}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>

      {primaryDomain && (
        <div className="mt-4 p-3 rounded-lg bg-white border border-green-200">
          <p className="text-xs text-slate-500 mb-1">Live preview URL (after DNS points to server):</p>
          <a
            href={`https://${primaryDomain.domain}/news`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-brand hover:underline break-all"
          >
            https://{primaryDomain.domain}/news
          </a>
        </div>
      )}
    </div>
  )
}
