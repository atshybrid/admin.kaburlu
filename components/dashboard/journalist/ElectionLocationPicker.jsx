/**
 * State → District → Mandal picker (locations API)
 * IDs are resolved internally — UI shows names only.
 */

import { useStates, useDistricts, useMandals } from '../../../hooks/useLocations'
import { FormField, Select } from '../../ui'

const EMPTY = {
  stateId: '',
  stateName: '',
  districtId: '',
  districtName: '',
  mandalId: '',
  mandalName: '',
}

export default function ElectionLocationPicker({ level = 'DISTRICT', value = EMPTY, onChange }) {
  const loc = { ...EMPTY, ...value }
  const { states, loading: statesLoading } = useStates()
  const { districts, loading: districtsLoading } = useDistricts(loc.stateId || null)
  const { mandals, loading: mandalsLoading } = useMandals(loc.districtId || null)

  const stateOptions = [
    { value: '', label: statesLoading ? 'Loading states…' : 'Select state…' },
    ...states.map((s) => ({ value: s.id, label: s.name })),
  ]

  const districtOptions = [
    {
      value: '',
      label: !loc.stateId
        ? 'Select state first'
        : districtsLoading
          ? 'Loading districts…'
          : 'Select district…',
    },
    ...districts.map((d) => ({ value: d.id, label: d.name })),
  ]

  const mandalOptions = [
    {
      value: '',
      label: !loc.districtId
        ? 'Select district first'
        : mandalsLoading
          ? 'Loading mandals…'
          : 'Select mandal…',
    },
    ...mandals.map((m) => ({ value: m.id, label: m.name })),
  ]

  const pickState = (id) => {
    const st = states.find((s) => s.id === id)
    onChange?.({
      ...EMPTY,
      stateId: id,
      stateName: st?.name || '',
    })
  }

  const pickDistrict = (id) => {
    const d = districts.find((x) => x.id === id)
    onChange?.({
      ...loc,
      districtId: id,
      districtName: d?.name || '',
      mandalId: '',
      mandalName: '',
    })
  }

  const pickMandal = (id) => {
    const m = mandals.find((x) => x.id === id)
    onChange?.({
      ...loc,
      mandalId: id,
      mandalName: m?.name || '',
    })
  }

  const showState = level === 'STATE' || level === 'DISTRICT' || level === 'MANDAL'
  const showDistrict = level === 'DISTRICT' || level === 'MANDAL'
  const showMandal = level === 'MANDAL'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {showState ? (
        <FormField label="State" required={level === 'STATE'}>
          <Select
            value={loc.stateId}
            onChange={(e) => pickState(e.target.value)}
            disabled={statesLoading}
            className="bg-white"
          >
            {stateOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}

      {showDistrict ? (
        <FormField label="District" required>
          <Select
            value={loc.districtId}
            onChange={(e) => pickDistrict(e.target.value)}
            disabled={!loc.stateId || districtsLoading}
            className="bg-white"
          >
            {districtOptions.map((opt) => (
              <option key={opt.value || 'empty-d'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}

      {showMandal ? (
        <FormField label="Mandal" required>
          <Select
            value={loc.mandalId}
            onChange={(e) => pickMandal(e.target.value)}
            disabled={!loc.districtId || mandalsLoading}
            className="bg-white"
          >
            {mandalOptions.map((opt) => (
              <option key={opt.value || 'empty-m'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
    </div>
  )
}

export { EMPTY as EMPTY_ELECTION_LOCATION }
