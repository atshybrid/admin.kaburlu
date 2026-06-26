/**
 * Location search — GET /locations/search-combined
 * Auto-fills state, district, mandal (+ IDs when available).
 */

import { locationService } from '../../../lib/api/services/locationService'
import AsyncSearchField from './AsyncSearchField'

export default function LocationSearchField({
  label = 'Search location',
  hint = 'District, mandal or village — Telugu or English',
  placeholder = 'e.g. Adilabad, హైదరాబాద్',
  value,
  onChange,
  onLocationPick,
  required,
  disabled,
  tenantId,
  className,
}) {
  return (
    <AsyncSearchField
      label={label}
      hint={hint}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className}
      searchFn={(term) => locationService.searchCombined(term, { tenantId, limit: 20 })}
      formatOption={(item) => locationService.formatItemLabel(item)}
      emptyHint="No location match — type state / district / mandal manually below."
      onSelect={(item) => {
        onLocationPick?.(locationService.fieldsFromPick(item))
      }}
    />
  )
}
