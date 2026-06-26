/**
 * PRGI newspaper search — GET /prgi/newspapers
 * Manual entry allowed when not in registry.
 */

import { prgiApi } from '../../../lib/api/services/prgiApi'
import AsyncSearchField from './AsyncSearchField'

export function formatNewspaperOption(item) {
  const parts = [
    item.title,
    item.registrationNumber || item.prgiNumber,
    item.district || item.publicationDistrict,
    item.state || item.publicationState,
  ].filter(Boolean)
  return parts.join(' · ')
}

export default function NewspaperSearchField({
  label = 'Newspaper / organization',
  hint = 'Search PRGI registry or type a custom name',
  placeholder = 'Type newspaper name…',
  value,
  onChange,
  onSelect,
  required,
  disabled,
  className,
}) {
  return (
    <AsyncSearchField
      label={label}
      hint={hint}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      required={required}
      disabled={disabled}
      className={className}
      searchFn={(term) => prgiApi.searchNewspapers(term, { limit: 20 })}
      formatOption={formatNewspaperOption}
      emptyHint="Not in PRGI registry — keep typing to use a manual newspaper name."
    />
  )
}
