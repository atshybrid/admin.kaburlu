import { canAccessNewsDesk } from '../../../lib/syndication/platformRoles'

export default function NewsDeskAccessGate({ user, children }) {
  if (!canAccessNewsDesk(user)) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Access denied</h2>
        <p className="text-sm text-rose-700 mt-2">
          News Desk is available only for authorized platform desk roles.
        </p>
      </div>
    )
  }
  return children
}