/**
 * Tenant Overview Tab - Status overview and quick info
 */

function StatusBadge({ status }) {
  const styles = {
    'VERIFIED': 'bg-green-50 text-green-700 border-green-200',
    'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
    'PENDING': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'INACTIVE': 'bg-slate-50 text-slate-600 border-slate-200',
  }
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] || styles['PENDING']}`}>
      {status || 'Unknown'}
    </span>
  )
}

function InfoCard({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-900">{value || '—'}</div>
    </div>
  )
}

export default function TenantOverviewTab({ tenantContext }) {
  const { tenant, entity, domains = [], categories = [], razorpay } = tenantContext || {}
  
  const primaryDomain = domains.find(d => d.isPrimary)
  const activeDomains = domains.filter(d => d.status === 'ACTIVE')
  
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{domains.length}</div>
          <div className="text-sm text-slate-500">Domains</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
          <div className="text-sm text-slate-500">Categories</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{activeDomains.length}</div>
          <div className="text-sm text-slate-500">Active Domains</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{razorpay?.keyId ? '✓' : '—'}</div>
          <div className="text-sm text-slate-500">Payments</div>
        </div>
      </div>

      {/* Basic Info */}
      <InfoCard title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={tenant?.name} />
          <Field label="Slug" value={tenant?.slug} />
          <Field label="PRGI Number" value={tenant?.prgiNumber} />
          <div>
            <div className="text-xs text-slate-500 mb-1">Status</div>
            <StatusBadge status={tenant?.prgiStatus} />
          </div>
        </div>
      </InfoCard>

      {/* Entity Summary */}
      <InfoCard 
        title="Registration Entity"
        action={entity ? null : (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Not configured</span>
        )}
      >
        {entity ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration Title" value={entity.registrationTitle} />
            <Field label="Language" value={entity.language?.name} />
            <Field label="Publisher" value={entity.publisherName} />
            <Field label="Periodicity" value={entity.periodicity} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Entity registration is required for tenant setup. Go to the Entity tab to configure.
          </p>
        )}
      </InfoCard>

      {/* Domains Summary */}
      <InfoCard 
        title="Domains"
        action={domains.length === 0 ? (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">No domains</span>
        ) : null}
      >
        {domains.length > 0 ? (
          <div className="space-y-2">
            {domains.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{d.domain}</span>
                  {d.isPrimary && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-brand/10 text-brand rounded">Primary</span>
                  )}
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
            {domains.length > 3 && (
              <p className="text-xs text-slate-500">+{domains.length - 3} more domains</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No domains configured. Go to the Domains tab to add your first domain.
          </p>
        )}
      </InfoCard>
    </div>
  )
}
