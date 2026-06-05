import { politicalPartiesApi } from '../api/services/politicalPartiesApi'
import { normalizeParty, normalizePartyRecord } from './normalize'
import { resolvePartyCode } from './resolvePartyCode'

/**
 * Resolve politicalPartyId + partyCode for POST /journalist/admin/surveys
 */
export async function resolvePartyForSurvey({ selectedParty, politicalPartyId } = {}) {
  let party = selectedParty ? normalizePartyRecord(selectedParty) : null
  let id = String(politicalPartyId || party?.id || '').trim()
  let code = resolvePartyCode(party)

  if ((!code || !party?.partyCode) && id) {
    try {
      const raw = await politicalPartiesApi.getAdmin(id)
      party = normalizeParty(raw) || party
      code = resolvePartyCode(party)
      id = String(party?.id || id)
    } catch {
      /* try public by code if id lookup failed */
    }
  }

  if (!code && id) {
    code = resolvePartyCode(party)
  }

  if (!id || !code) {
    return {
      ok: false,
      error:
        'Party code missing. In step 1, pick the party again from the list (must show code like BJP, BRS, AIMIM — not a blank name).',
    }
  }

  return {
    ok: true,
    politicalPartyId: id,
    partyCode: code,
    party,
  }
}
