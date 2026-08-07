import { prgiApi } from '../api/services/prgiApi'
import { tenantsApi } from '../api/tenantApi'

export const IPR_DRAFT_KEY = 'kaburlu:ipr-empanelment:draft:v1'

const valueAt = (source, paths) => {
  for (const path of paths) {
    const value = path.split('.').reduce((item, key) => item?.[key], source)
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return ''
}

const joinAddress = (...values) => values.filter(Boolean).join(', ')

export function toIprFormValues(source = {}) {
  const publisher = source.publisher || source.owner || source.entity || {}
  const editor = source.editor || {}
  const press = source.press || source.printingPress || {}
  const title = valueAt(source, ['title', 'newspaperName', 'registrationTitle', 'name'])
  const publisherAddress = joinAddress(
    valueAt(source, ['publisherAddress', 'publisher.address', 'entity.address', 'address']),
    valueAt(source, ['publisherMobile', 'publisher.mobile', 'contactMobile'])
  )
  const editorAddress = joinAddress(
    valueAt(source, ['editorAddress', 'editor.address']),
    valueAt(source, ['editorMobile', 'editor.mobile'])
  )
  const pressDetails = joinAddress(
    valueAt(source, ['printingPressName', 'pressName', 'press.name', 'printingPress.name']),
    valueAt(source, ['printingPressAddress', 'pressAddress', 'press.address', 'printingCityName']),
    valueAt(source, ['printingPressPhone', 'pressPhone', 'press.phone'])
  )

  return {
    newspaperName: title,
    publisherName: valueAt(source, ['publisherName', 'publisher.name', 'ownerName', 'entity.publisherName']),
    publisherAddress,
    publisherEmail: valueAt(source, ['publisherEmail', 'publisher.email', 'contactEmail']),
    publisherPhone: valueAt(source, ['publisherMobile', 'publisher.mobile', 'contactMobile']),
    editorName: valueAt(source, ['editorName', 'editor.name', 'entity.editorName']),
    editorAddress,
    editorEmail: valueAt(source, ['editorEmail', 'editor.email']),
    editorPhone: valueAt(source, ['editorMobile', 'editor.mobile']),
    editorQualification: valueAt(source, ['editorQualification', 'editor.qualification', 'qualification']),
    accreditationNo: valueAt(source, ['accreditationNo', 'editor.accreditationNo']),
    language: valueAt(source, ['language', 'languageName', 'publicationLanguage']) || 'Telugu',
    establishmentDate: valueAt(source, ['establishmentDate', 'publicationDate', 'dateOfEstablishment']),
    registrationDate: valueAt(source, ['registrationDate', 'prgiRegistrationDate']),
    publicationPlace: valueAt(source, ['publicationPlace', 'publicationDistrict', 'district', 'publicationCity']),
    panNo: valueAt(source, ['panNo', 'pan', 'publisher.panNo', 'entity.panNo']),
    prgiNo: valueAt(source, ['prgiNumber', 'registrationNumber']),
    rniNo: valueAt(source, ['rniNo', 'rniNumber']),
    pageCount: valueAt(source, ['pageCount', 'pages', 'numberOfPages']),
    editions: valueAt(source, ['editions', 'editionCount', 'numberOfEditions']) || '1',
    paperSize: valueAt(source, ['paperSize', 'sizeOfPaper']),
    copyPrice: valueAt(source, ['copyPrice', 'price', 'pricePerCopy']),
    printColour: valueAt(source, ['printColour', 'colour', 'color']) || 'Colour',
    pressDetails,
    pressOwnership: valueAt(source, ['pressOwnership', 'outsidePress', 'press.ownership']) || 'Outside press',
    pressCapacity: valueAt(source, ['pressCapacity', 'press.capacity', 'capacity']),
    pressType: valueAt(source, ['pressType', 'press.type', 'printingPressType']) || 'Web offset',
    printerName: valueAt(source, ['printerName', 'press.ownerName', 'press.owner']),
  }
}

export function mergeKnownValues(current, incoming) {
  return Object.fromEntries(Object.entries(incoming).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

export function createSmartDefaults(copies = '') {
  const count = Number(String(copies).replace(/,/g, '')) || 0
  const circulation = count
    ? `Rangareddy district · All Mandals · ${count.toLocaleString('en-IN')} copies`
    : ''
  return {
    language: 'Telugu',
    editions: '1',
    paperSize: '41.91 cm × 55.88 cm (EE Size)',
    printColour: 'Colour',
    davpEmpanelled: 'No',
    agentDetails: 'Self Distribution (No Agents Appointed)',
    districtMandalCirculation: circulation,
    publisherPublications: [{ name: 'NIL', language: '', periodicity: '', rni: '' }],
    editorPublications: [{ name: 'NIL', language: '', periodicity: '', rni: '' }],
    staff: [
      { role: 'Publisher', name: '', phone: '', address: '', salary: '' },
      { role: 'Editor', name: '', phone: '', address: '', salary: '' },
      { role: 'Designer', name: '', phone: '', address: '', salary: '' },
      { role: 'Marketing Executive', name: '', phone: '', address: '', salary: '' },
      { role: 'Reporter', name: '', phone: '', address: '', salary: '' },
    ],
  }
}

export function applyAutoStaff(form) {
  const defaults = createSmartDefaults().staff
  return defaults.map((member) => {
    if (member.role === 'Publisher') return { ...member, name: form.publisherName, phone: form.publisherPhone, address: form.publisherAddress }
    if (member.role === 'Editor') return { ...member, name: form.editorName, phone: form.editorPhone, address: form.editorAddress }
    return member
  })
}

export function staffToDetails(staff = []) {
  return staff
    .filter((member) => member.role || member.name)
    .map((member) => [member.role, member.name, member.phone, member.address, member.salary].filter(Boolean).join(' — '))
    .join('\n')
}

export function getValidationWarnings(form) {
  const checks = [
    ['PRGI number', form.prgiNo],
    ['PAN number', form.panNo],
    ['Publisher name', form.publisherName],
    ['CA certificate', form.documents?.caCertificate?.present],
    ['Printing press', form.pressDetails],
  ]
  return checks.filter(([, value]) => !value).map(([label]) => `${label} is missing`)
}

export function getDocumentChecklist(form) {
  const documents = form.documents || {}
  return [
    ['PRGI', Boolean(form.prgiNo) || documents.prgi?.present],
    ['PAN', Boolean(form.panNo) || documents.pan?.present],
    ['CA Certificate', documents.caCertificate?.present],
    ['Printer Certificate', documents.printerCertificate?.present],
    ['Owner Proof', documents.ownerProof?.present],
    ['Address Proof', documents.addressProof?.present],
  ]
}

export async function searchIprRecords(term) {
  const query = String(term || '').trim()
  if (query.length < 2) return []
  const [registry, tenantResult] = await Promise.allSettled([
    prgiApi.searchNewspapers(query, { limit: 30 }),
    tenantsApi.list(true),
  ])
  const registryItems = registry.status === 'fulfilled' ? registry.value?.items || [] : []
  const tenants = tenantResult.status === 'fulfilled'
    ? (tenantResult.value?.items || tenantResult.value?.data || tenantResult.value || [])
    : []
  const normalized = query.toLowerCase()
  const tenantItems = Array.isArray(tenants)
    ? tenants.filter((item) => [item.name, item.prgiNumber, item.phone, item.mobile, item.panNo, item.entity?.publisherName].some((value) => String(value || '').toLowerCase().includes(normalized)))
    : []
  const all = [...registryItems, ...tenantItems]
  return all.filter((item, index) => {
    const key = item.id || item.registrationNumber || item.prgiNumber || `${item.title || item.name}-${index}`
    return all.findIndex((candidate, candidateIndex) => (candidate.id || candidate.registrationNumber || candidate.prgiNumber || `${candidate.title || candidate.name}-${candidateIndex}`) === key) === index
  })
}

export async function findPrgiRecord(prgiNumber) {
  const records = await searchIprRecords(prgiNumber)
  const normalized = String(prgiNumber || '').trim().toLowerCase()
  return records.find((item) => [item.registrationNumber, item.prgiNumber, item.rniNo].some((value) => String(value || '').toLowerCase() === normalized)) || records[0] || null
}
