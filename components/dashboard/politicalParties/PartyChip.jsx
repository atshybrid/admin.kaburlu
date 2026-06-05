/**
 * Party chip — brand colors + symbol for lists and previews
 */
import { normalizePartyRecord, partyColors, partyDisplayName } from '../../../lib/politicalParties/normalize'

export default function PartyChip({ party, size = 'md', className = '' }) {
  if (!party) return null
  const p = normalizePartyRecord(party) || party
  const { primary, secondary } = partyColors(p)
  const name = partyDisplayName(p)
  const code = p.partyCode || p.shortCode || ''
  const symbolUrl = p.symbolUrl
  const symbolText = p.symbolText

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-1 gap-1.5'
      : size === 'lg'
        ? 'text-base px-4 py-2.5 gap-3'
        : 'text-sm px-3 py-2 gap-2'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium shadow-sm border border-black/5 ${sizeClasses} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${primary} 55%, ${secondary} 100%)`,
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      }}
      title={code ? `${name} (${code})` : name}
    >
      {symbolUrl ? (
        <img
          src={symbolUrl}
          alt=""
          className={`rounded-full object-cover bg-white/90 border border-white/50 ${
            size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
          }`}
        />
      ) : symbolText ? (
        <span
          className={`flex items-center justify-center rounded-full bg-white/20 font-bold ${
            size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
          }`}
        >
          {String(symbolText).slice(0, 2)}
        </span>
      ) : (
        <span
          className={`flex items-center justify-center rounded-full bg-white/25 font-bold uppercase ${
            size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
          }`}
        >
          {(code || name).slice(0, 2)}
        </span>
      )}
      <span className="truncate max-w-[12rem]">{name}</span>
      {code ? (
        <span className="opacity-80 font-mono text-[10px] uppercase tracking-wide">{code}</span>
      ) : null}
    </span>
  )
}
