import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { PDFDocument } from 'pdf-lib'
import html2canvas from 'html2canvas'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EmpanelmentPdfDocument from '../../components/ipr/EmpanelmentPdfDocument'
import { toast } from '../../components/ui'
import { iprEmpanelmentApi } from '../../lib/api/services/iprEmpanelmentApi'
import { reportersApi, tenantsApi } from '../../lib/api/tenantApi'
import { getToken } from '../../utils/auth'
import { getUserTenantId } from '../../utils/roleUtils'
import {
  IPR_DRAFT_KEY,
  applyAutoStaff,
  createSmartDefaults,
  findPrgiRecord,
  getDocumentChecklist,
  getValidationWarnings,
  mergeKnownValues,
  searchIprRecords,
  staffToDetails,
  toIprFormValues,
} from '../../lib/ipr/smartData'

const initialForm = {
  newspaperName: '', publisherName: '', publisherAddress: '', publisherEmail: '', publisherPhone: '', editorName: '',
  editorQualification: '', accreditationNo: '', editorAddress: '', editorEmail: '', editorPhone: '', language: 'Telugu',
  establishmentDate: '', registrationDate: '', previousEmpanelmentDate: '', publicationPlace: '', panNo: '', prgiNo: '', rniNo: '',
  pageCount: '', editions: '1', paperSize: '41.91 cm × 55.88 cm (EE Size)', printColour: 'Colour', copyPrice: '', dailyPrintCount: '',
  colourPageCount: '', circulation: '', pressDetails: '', pressOwnership: '', pressCapacity: '',
  pressType: 'Web offset', printerName: '', newsprintQuantity: '', agentDetails: 'Self Distribution (No Agents Appointed)', districtMandalCirculation: '',
  davpEmpanelled: 'No', davpCode: '', davpCopies: '', davpRate: '', staffDetails: '', staff: createSmartDefaults().staff,
  publisherPublications: [{ name: 'NIL', language: '', periodicity: '', rni: '' }],
  editorPublications: [{ name: 'NIL', language: '', periodicity: '', rni: '' }],
  documents: {
    prgi: { present: false, name: '' }, pan: { present: false, name: '' }, caCertificate: { present: false, name: '' },
    printerCertificate: { present: false, name: '' }, ownerProof: { present: false, name: '' }, addressProof: { present: false, name: '' },
  },
  declarationDate: '', declarationPlace: '', signatoryName: '',
}

const iprSchema = z.object({
  prgiNo: z.string(),
  rniNo: z.string(),
  publisherName: z.string(),
  panNo: z.string(),
  pressDetails: z.string(),
  documents: z.record(z.string(), z.object({ present: z.boolean(), name: z.string() })),
}).passthrough()

const sections = [
  ['Part A · Newspaper and publisher', [
    ['newspaperName', '1. Name of the newspaper'],
    ['publisherName', '2. Name of the publisher'],
    ['publisherAddress', '3. Publisher address with telephone number', 'textarea'],
    ['publisherPhone', 'Publisher mobile number', 'tel'],
    ['publisherEmail', '4. Publisher email', 'email'],
    ['editorName', '5. Name of the editor'],
    ['editorQualification', '5(a). Educational qualification'],
    ['accreditationNo', '5(b). Existing accreditation number'],
    ['editorAddress', '6. Editor address with telephone number', 'textarea'],
    ['editorPhone', 'Editor mobile number', 'tel'],
    ['editorEmail', '7. Editor email', 'email'],
    ['language', '8. Language', 'select', ['Telugu', 'Urdu', 'Hindi', 'English']],
    ['establishmentDate', '9. Date of establishment', 'date'],
    ['registrationDate', 'PRGI registration date', 'date'],
    ['previousEmpanelmentDate', '10. Previous I&PR empanelment date', 'date'],
    ['publicationPlace', '11. Place of publication'],
    ['panNo', '12. PAN number of publisher'],
    ['rniNo', '13. R.N.I. number and year'],
    ['pageCount', '14. Number of pages', 'number'],
    ['editions', '15. Number of editions (give details)'],
  ]],
  ['Part A · Printing and circulation', [
    ['paperSize', '16. Size of the paper (e.g. 33 cm × 54 cm)'],
    ['printColour', '17. Colour or Black & White', 'select', ['Colour', 'B&W']],
    ['copyPrice', '18. Price per copy'],
    ['dailyPrintCount', '19. Number of papers printed daily', 'number'],
    ['colourPageCount', '19(a). Number of colour pages', 'number'],
    ['circulation', '20. Circulation (ABC / IRS / CA)'],
    ['pressDetails', '21. Name, address and telephone of press', 'textarea'],
    ['printerName', 'Printer / press owner name'],
    ['pressOwnership', '22. Own press or outside press', 'select', ['Own press', 'Outside press']],
    ['pressCapacity', '22(a). Press capacity (copies/hour)', 'number'],
    ['pressType', '22(b). Type of press', 'select', ['Web offset', 'Sheetfed']],
  ]],
  ['Part B & C · Distribution and DAVP', [
    ['newsprintQuantity', '23. Quantity of newsprint used per day'],
    ['agentDetails', '24. Distribution agents with addresses and telephone numbers', 'textarea'],
    ['districtMandalCirculation', '25. District-wise and Mandal-wise circulation', 'textarea'],
    ['davpEmpanelled', '26. Is the newspaper DAVP empanelled?', 'select', ['Yes', 'No']],
    ['davpCode', '27(a). DAVP code'],
    ['davpCopies', '27(b). Number of copies', 'number'],
    ['davpRate', '27(c). Rate for sq.cm.'],
  ]],
  ['Part D · Staff', [
    ['staffDetails', '28. Staff details — names, addresses, phone numbers and salary particulars', 'textarea'],
  ]],
]

function Field({ field, value, onChange }) {
  const [name, label, type = 'text', options = []] = field
  const shared = {
    id: name,
    value: value || '',
    onChange: (event) => onChange(name, event.target.value),
    className: 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20',
  }
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      {type === 'textarea' ? <textarea {...shared} rows="3" /> : type === 'select' ? (
        <select {...shared}>{options.map((option) => <option key={option}>{option}</option>)}</select>
      ) : <input {...shared} type={type} />}
    </label>
  )
}

function PublicationsTable({ label, rows, onChange }) {
  const update = (index, key, value) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row)
    onChange(next)
  }
  const add = () => onChange([...rows, { name: '', language: '', periodicity: '', rni: '' }])
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{label}</h2>
        <button type="button" onClick={add} className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5">Add publication</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{['Name of publication', 'Language', 'Periodicity', 'RNI'].map((heading) => <th className="p-2 font-medium" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => <tr className="border-t border-slate-100" key={index}>
              {['name', 'language', 'periodicity', 'rni'].map((key) => <td className="p-2" key={key}><input value={row[key]} onChange={(event) => update(index, key, event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 outline-none focus:border-brand" /></td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StaffTable({ staff, onChange }) {
  const update = (index, key, value) => onChange(staff.map((member, memberIndex) => memberIndex === index ? { ...member, [key]: value } : member))
  const add = () => onChange([...staff, { role: 'Staff member', name: '', phone: '', address: '', salary: '' }])
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-semibold text-slate-900">Part D · Staff</h2><p className="mt-1 text-sm text-slate-500">Publisher and Editor fill from form data. Reporters auto-fill from the selected tenant.</p></div>
        <button type="button" onClick={add} className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5">Add staff</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{['Role', 'Name', 'Phone', 'Address', 'Salary'].map((heading) => <th className="p-2 font-medium" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{staff.map((member, index) => <tr className="border-t border-slate-100" key={`${member.role}-${index}`}>
            {['role', 'name', 'phone', 'address', 'salary'].map((key) => <td className="p-2" key={key}><input value={member[key] || ''} onChange={(event) => update(index, key, event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 outline-none focus:border-brand" /></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

function DocumentChecklist({ items, documents, onChange }) {
  const keys = ['prgi', 'pan', 'caCertificate', 'printerCertificate', 'ownerProof', 'addressProof']
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Document check</h2>
      <p className="mt-1 text-sm text-slate-500">Files are recorded in this browser draft. Upload them to the submission system when it is available.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map(([label, complete], index) => {
          const key = keys[index]
          return <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 ${complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{complete ? '✓' : '!'}</span>
            <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{label}<span className="mt-0.5 block truncate text-xs font-normal text-slate-500">{documents[key]?.name || (complete ? 'Available from form data' : 'Missing')}</span></span>
            <input type="file" className="w-24 text-xs" onChange={(event) => onChange(key, event.target.files?.[0])} />
          </label>
        })}
      </div>
    </section>
  )
}

export default function IprEmpanelmentApplication() {
  const router = useRouter()
  const { watch, reset, setValue, getValues } = useForm({ defaultValues: initialForm, resolver: zodResolver(iprSchema) })
  const form = watch()
  const [exporting, setExporting] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [saveState, setSaveState] = useState('Local draft')
  const exportDocumentRef = useRef(null)
  const applicationIdRef = useRef('')
  const reportersFilledForRef = useRef('')
  const savingRef = useRef(false)
  const tenantId = selectedTenantId || (typeof router.query.tenantId === 'string' ? router.query.tenantId : '')
  const prgiLookup = useMutation({ mutationFn: findPrgiRecord })
  const recordSearch = useMutation({ mutationFn: searchIprRecords })
  const tenantsQuery = useQuery({
    queryKey: ['ipr-empanelment-tenants'],
    queryFn: async () => {
      const response = await tenantsApi.list(true)
      const items = response?.items || response?.data?.items || response?.data || response || []
      return Array.isArray(items) ? items : []
    },
  })
  const reportersQuery = useQuery({
    queryKey: ['ipr-empanelment-reporters', tenantId],
    queryFn: async () => {
      const data = await reportersApi.list(tenantId)
      return Array.isArray(data) ? data : (data?.data || data?.items || [])
    },
    enabled: Boolean(tenantId),
  })
  const reporters = reportersQuery.data || []
  const update = (name, value) => setValue(name, value, { shouldDirty: true })
  const warnings = useMemo(() => getValidationWarnings(form), [form])
  const documentChecklist = useMemo(() => getDocumentChecklist(form), [form])

  const saveToBackend = useCallback(async (snapshot = form) => {
    const user = getToken()?.user || getToken()?.data?.user
    const role = String(user?.role?.name || user?.role || user?.roleName || '').toUpperCase().replace(/[_\s-]/g, '')
    if ((role === 'SUPERADMIN' || role === 'ADMIN') && !tenantId && !applicationIdRef.current) {
      const message = 'Enter Tenant ID before saving this Super Admin draft'
      setSaveState(message)
      throw new Error(message)
    }
    if (savingRef.current) return applicationIdRef.current
    savingRef.current = true
    setSaveState('Saving to backend…')
    try {
      const response = applicationIdRef.current
        ? await iprEmpanelmentApi.update(applicationIdRef.current, snapshot)
        : await iprEmpanelmentApi.create(snapshot, { tenantId })
      const id = response?.item?.id || applicationIdRef.current
      if (!id) throw new Error('Backend did not return an application ID')
      applicationIdRef.current = id
      setApplicationId(id)
      window.localStorage.setItem(IPR_DRAFT_KEY, JSON.stringify({ form: snapshot, applicationId: id, savedAt: new Date().toISOString() }))
      setLastSaved(new Date())
      setSaveState('Saved to backend')
      return id
    } catch (error) {
      setSaveState('Local draft only')
      throw error
    } finally {
      savingRef.current = false
    }
  }, [form, tenantId])

  useEffect(() => {
    const user = getToken()?.user || getToken()?.data?.user
    const userTenantId = getUserTenantId(user)
    if (userTenantId) setSelectedTenantId((current) => current || userTenantId)
  }, [])

  useEffect(() => {
    if (!draftRestored || !tenantId || !reportersQuery.isSuccess || !reporters.length) return
    const key = `${tenantId}:${reporters.map((reporter) => reporter.id).join(',')}`
    if (reportersFilledForRef.current === key) return
    reportersFilledForRef.current = key
    setValue('staff', applyAutoStaff(getValues(), reporters), { shouldDirty: true })
  }, [draftRestored, tenantId, reportersQuery.isSuccess, reporters, getValues, setValue])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(IPR_DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft?.form) {
          reset({ ...initialForm, ...draft.form, documents: { ...initialForm.documents, ...draft.form.documents } })
          if (draft.applicationId) {
            applicationIdRef.current = draft.applicationId
            setApplicationId(draft.applicationId)
            iprEmpanelmentApi.get(draft.applicationId).then((response) => {
              const remoteForm = response?.item?.formData
              if (remoteForm) reset({ ...initialForm, ...remoteForm, documents: { ...initialForm.documents, ...remoteForm.documents } })
            }).catch(() => {})
          }
          toast.success('Recovered your I&PR draft')
        }
      }
    } catch {
      window.localStorage.removeItem(IPR_DRAFT_KEY)
    } finally {
      setDraftRestored(true)
    }
  }, [reset])

  useEffect(() => {
    if (!draftRestored) return undefined
    const saveDraft = window.setTimeout(() => {
      window.localStorage.setItem(IPR_DRAFT_KEY, JSON.stringify({ form, applicationId: applicationIdRef.current, savedAt: new Date().toISOString() }))
      setLastSaved(new Date())
      saveToBackend(form).catch((error) => toast.error(error.message || 'Backend autosave failed'))
    }, 5000)
    return () => window.clearTimeout(saveDraft)
  }, [form, draftRestored, saveToBackend])

  const applySmartDefaults = () => {
    const defaults = createSmartDefaults(form.dailyPrintCount)
    const next = { ...form, ...defaults }
    next.staff = applyAutoStaff({ ...next, ...form }, reporters)
    reset(next)
    toast.success('Smart defaults applied')
  }

  const applyRecord = (record) => {
    const mapped = toIprFormValues(record)
    const next = { ...form, ...mergeKnownValues(form, mapped) }
    next.staff = applyAutoStaff(next, reporters)
    next.districtMandalCirculation = next.dailyPrintCount
      ? createSmartDefaults(next.dailyPrintCount).districtMandalCirculation
      : form.districtMandalCirculation
    reset(next)
    const filled = Object.values(mapped).filter(Boolean).length
    toast.success(`Autofill applied ${filled} available fields`)
  }

  const autoFillFromPrgi = async () => {
    if (!form.prgiNo.trim()) return toast.error('Enter a PRGI number first')
    try {
      const record = await prgiLookup.mutateAsync(form.prgiNo)
      if (!record) return toast.error('No PRGI or tenant record was found for this number')
      applyRecord(record)
    } catch (error) {
      toast.error(error.message || 'PRGI lookup failed')
    }
  }

  const updateDocument = async (key, file) => {
    reset({
      ...form,
      documents: {
        ...form.documents,
        [key]: { present: Boolean(file), name: file?.name || '' },
      },
    })
    if (!file) return
    try {
      let id = applicationIdRef.current
      if (!id) {
        setSaveState('Creating draft for document upload…')
        const created = await iprEmpanelmentApi.create(form, { tenantId })
        id = created?.item?.id
        if (!id) throw new Error('Draft create did not return an application ID')
        applicationIdRef.current = id
        setApplicationId(id)
      }
      const response = await iprEmpanelmentApi.uploadAndAttachDocument(id, key, file)
      const uploaded = response?.item?.documents?.[key]
      setValue(`documents.${key}`, { present: true, name: uploaded?.fileName || file.name, ...uploaded })
      toast.success(`${key} uploaded`)
    } catch (error) {
      toast.error(error.message || `Unable to upload ${key}`)
    }
  }

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ipr-empanelment-draft.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = JSON.parse(await file.text())
      reset({ ...initialForm, ...form, ...imported, documents: { ...initialForm.documents, ...form.documents, ...imported.documents } })
      toast.success('Previous I&PR application imported')
    } catch {
      toast.error('Choose a valid I&PR JSON export')
    } finally {
      event.target.value = ''
    }
  }

  const exportDocx = async () => {
    try {
      const { Document, HeadingLevel, Packer, Paragraph } = await import('docx')
      const fields = sections.flatMap(([section, entries]) => [
        new Paragraph({ text: section, heading: HeadingLevel.HEADING_2 }),
        ...entries.map(([key, label]) => new Paragraph({ text: `${label}: ${form[key] || '—'}` })),
      ])
      const docxDocument = new Document({
        sections: [{
          children: [
            new Paragraph({ text: 'I&PR Newspaper Empanelment Application', heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `PRGI: ${form.prgiNo || '—'}` }),
            new Paragraph({ text: `RNI: ${form.rniNo || '—'}` }),
            ...fields,
            new Paragraph({ text: 'Staff', heading: HeadingLevel.HEADING_2 }),
            ...form.staff.map((member) => new Paragraph({ text: staffToDetails([member]) || member.role })),
            new Paragraph({ text: 'Supporting documents', heading: HeadingLevel.HEADING_2 }),
            ...documentChecklist.map(([label, complete]) => new Paragraph({ text: `${complete ? '✓' : '☐'} ${label}` })),
          ],
        }],
      })
      const bytes = await Packer.toBlob(docxDocument)
      const url = URL.createObjectURL(bytes)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'ipr-empanelment-application.docx'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message || 'Unable to generate DOCX')
    }
  }

  const saveDraftNow = async () => {
    try {
      await saveToBackend(form)
      toast.success('Draft saved to backend')
    } catch (error) {
      toast.error(error.message || 'Unable to save draft')
    }
  }

  const exportPdf = async () => {
    setExporting(true)
    try {
      await saveToBackend(form)
      const pageNodes = Array.from(exportDocumentRef.current?.querySelectorAll('.page') || [])
      if (pageNodes.length !== 4) throw new Error('The HTML application layout is not ready.')
      const pdf = await PDFDocument.create()
      for (const pageNode of pageNodes) {
        const canvas = await html2canvas(pageNode, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true })
        const image = await pdf.embedPng(canvas.toDataURL('image/png'))
        const page = pdf.addPage([630, 1000])
        page.drawImage(image, { x: 0, y: 0, width: 630, height: 1000 })
      }
      const bytes = await pdf.save()
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `ipr-empanelment-html-${form.newspaperName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'application'}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message || 'Unable to export the PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <DashboardLayout title="I&PR Empanelment Application">
      <>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-6 text-white">
          <p className="text-sm font-medium text-white/75">Government of Telangana · Department of Information & Public Relations</p>
          <h1 className="mt-1 text-2xl font-bold">Newspaper Empanelment Application</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/85">Enter the application details below. Exported PDFs retain the original four-page I&PR format with your details placed on the corresponding fields.</p>
        </div>

        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Attach the certificates and enclosures listed in the source form separately when submitting the exported application.
        </div>

        <section className="mb-6 rounded-xl border border-brand/30 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="block flex-1 text-sm font-semibold text-slate-800" htmlFor="ipr-prgi-lookup">
              PRGI registration number
              <input id="ipr-prgi-lookup" value={form.prgiNo} onChange={(event) => update('prgiNo', event.target.value)} placeholder="e.g. TGTEL/25/A5132" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </label>
            <button type="button" onClick={autoFillFromPrgi} disabled={prgiLookup.isPending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70">
              {prgiLookup.isPending ? 'Looking up PRGI…' : 'Auto Fill From PRGI'}
            </button>
            <button type="button" onClick={applySmartDefaults} className="rounded-lg border border-brand px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5">
              Apply smart defaults
            </button>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className={`rounded-lg border p-3 ${warnings.length ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <span className="font-semibold text-slate-800">{warnings.length ? 'Needs attention' : 'Ready to export'}</span>
              <p className="mt-1 text-slate-600">{warnings.length ? warnings.join(' · ') : 'Required PRGI, publisher, PAN, CA certificate and press details are present.'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
              <span className="font-semibold text-slate-800">Draft save</span>
              <p className="mt-1">{saveState}{applicationId ? ` · ID ${applicationId}` : ''}{lastSaved ? ` · ${lastSaved.toLocaleTimeString()}` : ''}.</p>
            </div>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Tenant <span className="font-normal text-slate-500">(required only for Super Admin create)</span>
            <select value={tenantId} onChange={(event) => { reportersFilledForRef.current = ''; setSelectedTenantId(event.target.value) }} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
              <option value="">{tenantsQuery.isPending ? 'Loading tenants…' : 'Select tenant'}</option>
              {tenantsQuery.data?.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name || tenant.slug || 'Unnamed tenant'}{tenant.prgiNumber ? ` · ${tenant.prgiNumber}` : ''}</option>)}
            </select>
          </label>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') recordSearch.mutate(searchTerm) }} placeholder="Search PRGI, publisher, phone, PAN or newspaper" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              <button type="button" onClick={() => recordSearch.mutate(searchTerm)} disabled={recordSearch.isPending || searchTerm.trim().length < 2} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{recordSearch.isPending ? 'Searching…' : 'Search records'}</button>
            </div>
            {recordSearch.data?.length > 0 && <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-slate-200">
              {recordSearch.data.map((record, index) => <button type="button" onClick={() => applyRecord(record)} key={record.id || record.prgiNumber || record.registrationNumber || index} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-brand/5">
                <span className="font-medium text-slate-800">{record.title || record.name || record.registrationTitle || 'Untitled publication'}</span>
                <span className="shrink-0 font-mono text-xs text-slate-500">{record.registrationNumber || record.prgiNumber || record.panNo || 'Select to autofill'}</span>
              </button>)}
            </div>}
          </div>
        </section>

        <div className="space-y-5">
          {sections.filter(([title]) => title !== 'Part D · Staff').map(([title, fields]) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={title}>
            <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fields.map((field) => <div key={field[0]} className={field[2] === 'textarea' ? 'md:col-span-2' : ''}><Field field={field} value={form[field[0]]} onChange={update} /></div>)}
            </div>
          </section>)}
          <StaffTable staff={form.staff} onChange={(staff) => update('staff', staff)} />
          <PublicationsTable label="Part E · Other publications by the same publisher" rows={form.publisherPublications} onChange={(rows) => update('publisherPublications', rows)} />
          <PublicationsTable label="Part E · Other publications by the same editor" rows={form.editorPublications} onChange={(rows) => update('editorPublications', rows)} />
          <DocumentChecklist items={documentChecklist} documents={form.documents} onChange={updateDocument} />
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Declaration</h2>
            <p className="mb-5 text-sm text-slate-600">By exporting, the publisher affirms the three declarations printed in the original I&PR application.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field field={['declarationDate', 'Date', 'date']} value={form.declarationDate} onChange={update} />
              <Field field={['declarationPlace', 'Place']} value={form.declarationPlace} onChange={update} />
              <Field field={['signatoryName', 'Publisher / Editor signatory name']} value={form.signatoryName} onChange={update} />
            </div>
          </section>
        </div>

        <div className="sticky bottom-4 mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={saveDraftNow} className="rounded-xl border border-brand bg-white px-4 py-3 text-sm font-semibold text-brand shadow-lg hover:bg-brand/5">Save Draft</button>
          <button type="button" onClick={exportPdf} disabled={exporting} className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70">
            {exporting ? 'Saving & preparing PDF…' : 'Save & Generate PDF'}
          </button>
        </div>
        </main>
        <div ref={exportDocumentRef} aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 0, width: '630px', pointerEvents: 'none' }}>
          <EmpanelmentPdfDocument form={form} />
        </div>
      </>
    </DashboardLayout>
  )
}
