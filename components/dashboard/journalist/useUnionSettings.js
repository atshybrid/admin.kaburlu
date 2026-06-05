import { useState, useEffect } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { normalizeUnionSettings } from '../../../lib/journalist/apiNormalize'
import { DEFAULT_UNION_NAME, resolveUnionName } from '../../../lib/journalist/unionConfig'

/** Union name for list/create APIs — defaults to DJF (Working). */
export function useUnionSettings() {
  const [unionName, setUnionName] = useState(DEFAULT_UNION_NAME)
  const [settingsReady, setSettingsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = await journalistApi.getSettings(DEFAULT_UNION_NAME)
        const data = normalizeUnionSettings(raw)
        if (!cancelled) setUnionName(resolveUnionName(data.unionName))
      } catch {
        if (!cancelled) setUnionName(DEFAULT_UNION_NAME)
      } finally {
        if (!cancelled) setSettingsReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    unionName: resolveUnionName(unionName),
    settingsReady,
    isDefaultUnion: resolveUnionName(unionName) === DEFAULT_UNION_NAME,
  }
}
