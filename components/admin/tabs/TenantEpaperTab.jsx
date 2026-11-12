import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import smartDesignApi from '../../../lib/api/services/smartDesignApi'
import epaperApi from '../../../lib/api/services/epaperApi'
import mediaApi from '../../../lib/api/services/mediaApi'
import { setHeaderStyleCatalogCache } from '../../../lib/epaper/headerStyleCatalog'
import {
  findPaperSpec,
  formatPaperSpecSummary,
  indexPaperSpecs,
  normalizePaperTypeKey,
} from '../../../lib/epaper/paperPageSpecs'
import { formToSmartDesignPayload, smartDesignToForm, rowsFromEditionsCatalog } from '../../../lib/epaper/smartDesignForm'
import {
  formToNewspaperConfigPayload,
  newspaperConfigToForm,
} from '../../../lib/epaper/newspaperConfigForm'

const EMPTY_FORM = {
  paperType: 'TABLOID',
  pageSize: 'TABLOID',
  defaultPageCount: 8,
  perPageCostMonthly: 0,
  perPagePrice: 0,
  paperSellCost: 5,
  volumeNumber: 1,
  volumeStartNumber: 1,
  volumeStartYear: new Date().getFullYear(),
  issueNumber: 1,
  issueStartNumber: 1,
  issueStartDate: new Date().toISOString().slice(0, 10),
  issueCounterMode: 'SEQUENTIAL',
  newsCloseTime: '23:00',
  languageCode: 'te',
  headerStyleNumber: 1,
  subHeaderStyleNumber: 1,
  headerData: '',
  headerLogoUrl: '',
  paperNameImageUrl: '',
  headerLeftImageUrl: '',
  headerRightImageUrl: '',
  publishedAreaText: '',
  lastPageFooterText: '',
  subHeaderLogoUrl: '',
  subHeaderImageUrl: '',
}

function resolveScopeLabel(editions, editionId, subEditionId) {
  const ed = editions.find((item) => String(item.id) === String(editionId))
  if (!ed) return editionId || '—'
  if (subEditionId) {
    const sub = (ed.subEditions || []).find((s) => String(s.id) === String(subEditionId))
    return `${ed.name || ed.slug || editionId} › ${sub?.name || sub?.slug || subEditionId}`
  }
  return ed.name || ed.slug || editionId
}

function rowKeyFromScope(editionId, subEditionId) {
  return subEditionId ? `sub:${subEditionId}` : `edition:${editionId || ''}`
}

function ImageUrlField({ label, hint, value, onChange, onUpload, busy, uploading }) {
  return (
    <label className="text-xs text-slate-600 block">
      {label}
      {hint ? <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{hint}</span> : null}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={busy}
        placeholder="https://… or upload below"
        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          disabled={busy || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ''
          }}
          className="block w-full text-[11px] text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium disabled:opacity-60"
        />
        {uploading ? <span className="text-[11px] text-slate-500">Uploading…</span> : null}
      </div>
    </label>
  )
}

export default function TenantEpaperTab({ tenantContext }) {
  const tenantId = tenantContext?.tenantId

  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [smartContext, setSmartContext] = useState(null)
  const [editionCatalog, setEditionCatalog] = useState(null)
  const [apiHeaderStyles, setApiHeaderStyles] = useState(null)
  const [paperSpecs, setPaperSpecs] = useState(null)
  const [nextAction, setNextAction] = useState('CREATE')
  const [allSmartDesigns, setAllSmartDesigns] = useState([])
  const [smartDesignId, setSmartDesignId] = useState(null)
  const [selectedRowKey, setSelectedRowKey] = useState('')
  const [editions, setEditions] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [listMeta, setListMeta] = useState({
    contextDesigns: 0,
    contextEditions: 0,
    editionsApiCount: 0,
    contextError: '',
    editionsError: '',
  })

  const [scopeType, setScopeType] = useState('edition')
  const [editionId, setEditionId] = useState('')
  const [subEditionId, setSubEditionId] = useState('')

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [designToday, setDesignToday] = useState(null)
  const [activeDesign, setActiveDesign] = useState(null)
  const [tenantNewsConfig, setTenantNewsConfig] = useState(null)
  const [tenantConfigForm, setTenantConfigForm] = useState(null)
  const [tenantConfigSaving, setTenantConfigSaving] = useState(false)
  const [collectSummary, setCollectSummary] = useState(null)
  const [collectBusy, setCollectBusy] = useState(false)

  const configKey = useMemo(
    () => (scopeType === 'sub-edition' ? `sub:${subEditionId || ''}` : `edition:${editionId || ''}`),
    [scopeType, editionId, subEditionId]
  )

  const mainHeaderOptions = useMemo(() => {
    const fromApi = apiHeaderStyles?.mainHeaders
    return Array.isArray(fromApi) ? fromApi : []
  }, [apiHeaderStyles])

  const subHeaderOptions = useMemo(() => {
    const fromApi = apiHeaderStyles?.subHeaders
    return Array.isArray(fromApi) ? fromApi : []
  }, [apiHeaderStyles])

  const paperTypeOptions = useMemo(() => {
    const items = paperSpecs?.items || apiHeaderStyles?.paperPageSpecs || []
    if (items.length) {
      return items.map((item) => ({
        value: item.paperType,
        label: item.label || item.paperType,
      }))
    }
    return [
      { value: 'TABLOID', label: 'Tabloid (11×17″)' },
      { value: 'BROADSHEET', label: 'Broadsheet (15×22.75″)' },
    ]
  }, [paperSpecs, apiHeaderStyles])

  const activePaperSpec = useMemo(() => {
    const pt = form.paperType || form.pageSize
    return findPaperSpec(paperSpecs?.items || apiHeaderStyles?.paperPageSpecs, pt)
  }, [paperSpecs, apiHeaderStyles, form.paperType, form.pageSize])

  const allowedUploadFields = useMemo(() => {
    const fromDesign = activeDesign?.styleCapabilities?.allowedFields
    if (fromDesign && typeof fromDesign === 'object') return fromDesign
    return {
      headerLogoUrl: true,
      headerLeftImageUrl: true,
      headerRightImageUrl: true,
      paperNameImageUrl: true,
      subHeaderLogoUrl: true,
    }
  }, [activeDesign])

  const printNewsWindow = useMemo(() => {
    return (
      designToday?.newsWindow ||
      tenantNewsConfig?.today?.newsWindow ||
      tenantConfigForm?.newsWindow ||
      null
    )
  }, [designToday, tenantNewsConfig, tenantConfigForm])

  const headerRenderHint = apiHeaderStyles?.renderEngine?.recommended
    ? `API recommends: Main style ${apiHeaderStyles.renderEngine.recommended.page1Main}, Sub style ${apiHeaderStyles.renderEngine.recommended.page2PlusSub}`
    : ''

  const designTableRows = useMemo(() => {
    const fromEditions = rowsFromEditionsCatalog(editionCatalog, editions)
    if (fromEditions.length) return fromEditions

    return allSmartDesigns.map((d) => {
      const eid = d.publicationEditionId || d.editionId
      const sid = d.subEditionId || ''
      return {
        id: d.id,
        key: rowKeyFromScope(eid, sid),
        source: 'smart-design',
        scopeType: sid ? 'sub-edition' : 'edition',
        editionId: eid,
        subEditionId: sid,
        scopeLabel: resolveScopeLabel(editions, eid, sid),
        paperType: d.paperType || d.pageSize,
        pageSize: d.paperType || d.pageSize,
        defaultPageCount: d.totalPages,
        paperSellCost: d.paperSellCost,
        volumeNumber: d.today?.currentVolume ?? d.volumeStartNumber,
        issueNumber: d.today?.currentIssue ?? d.issueStartNumber,
        headerStyleNumber: d.headerStyleNumber,
        subHeaderStyleNumber: d.subHeaderStyleNumber,
        hasDesign: true,
        nextAction: 'UPDATE',
        updatedAt: d.updatedAt || d.createdAt,
        raw: d,
      }
    })
  }, [editionCatalog, editions, allSmartDesigns])

  const mainStyleName = (n) => mainHeaderOptions.find((s) => s.number === Number(n))?.name || `#${n}`
  const subStyleName = (n) => subHeaderOptions.find((s) => s.number === Number(n))?.name || `#${n}`

  const layoutPreviewHref = useCallback(
    (editionIdOverride, issueDateOverride) => {
      const eid = editionIdOverride || editionId || editions[0]?.id
      if (!tenantId || !eid) return null
      const q = new URLSearchParams({
        tenantId: String(tenantId),
        editionId: String(eid),
        startPage: '2',
      })
      const issue =
        issueDateOverride ||
        form.issueStartDate ||
        new Date().toISOString().slice(0, 10)
      if (issue && /^\d{4}-\d{2}-\d{2}$/.test(String(issue).slice(0, 10))) {
        q.set('issueDate', String(issue).slice(0, 10))
      }
      return `/admin/epaper/design?${q.toString()}`
    },
    [tenantId, editionId, editions, form.issueStartDate]
  )

  const selectedEdition = useMemo(
    () => editions.find((item) => String(item?.id) === String(editionId)) || null,
    [editions, editionId]
  )

  const availableSubEditions = useMemo(() => {
    const list = selectedEdition?.subEditions
    return Array.isArray(list) ? list : []
  }, [selectedEdition])

  const isValidScopeSelection = useMemo(() => {
    if (scopeType === 'edition') return !!editionId
    return !!editionId && !!subEditionId
  }, [scopeType, editionId, subEditionId])

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const syncFormFromConfig = useCallback((cfg) => {
    if (!cfg) return
    const mapped = smartDesignToForm(cfg) || cfg
    setForm((prev) => ({ ...prev, ...mapped }))
  }, [])

  const loadByEditionScope = useCallback(
    async (eid, sid = '', scope = 'edition') => {
      if (!tenantId || !eid) return
      try {
        const query = { publicationEditionId: eid }
        if (scope === 'sub-edition' && sid) query.subEditionId = sid
        const res = await smartDesignApi.getByEdition(tenantId, query)
        setNextAction(res?.nextAction || (res?.exists ? 'UPDATE' : 'CREATE'))
        const rowKey =
          scope === 'sub-edition' && sid ? `sub:${sid}` : `edition:${eid}`
        if (res?.exists && res?.design) {
          setSmartDesignId(res.design.id)
          syncFormFromConfig(res.design)
          setActiveDesign(res.design)
          setDesignToday(res.design.today || null)
          setSelectedRowKey(rowKey)
        } else {
          setSmartDesignId(null)
          setForm({ ...EMPTY_FORM })
          setActiveDesign(null)
          setDesignToday(null)
          setSelectedRowKey('')
        }
        return res
      } catch (e) {
        setError(e?.message || String(e))
        return null
      }
    },
    [tenantId, syncFormFromConfig]
  )

  const loadAll = useCallback(async () => {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      let sdCtx = null
      let ctxError = ''
      try {
        sdCtx = await smartDesignApi.getContext(tenantId)
      } catch (e) {
        ctxError = e?.message || String(e)
      }

      let editionsResp = null
      let editionsError = ''
      try {
        editionsResp = await smartDesignApi.getEditions(tenantId)
      } catch (e) {
        editionsError = e?.message || String(e)
      }

      let headerStyles = null
      try {
        headerStyles = await smartDesignApi.getHeaderStyles(tenantId)
      } catch {
        try {
          headerStyles = await epaperApi.getHeaderStyles()
        } catch {
          /* catalog optional */
        }
      }

      let specsPayload = null
      try {
        specsPayload = await epaperApi.getPaperPageSpecs()
      } catch {
        /* optional */
      }

      let newsCfg = null
      try {
        newsCfg = await epaperApi.getNewspaperConfig(tenantId)
        setTenantNewsConfig(newsCfg)
        setTenantConfigForm(newspaperConfigToForm(newsCfg))
      } catch (e) {
        setTenantNewsConfig(null)
        setTenantConfigForm(newspaperConfigToForm({}))
        setListMeta((prev) => ({
          ...prev,
          contextError: prev.contextError || (e?.message ? `newspaper-config: ${e.message}` : ''),
        }))
      }
      const specItems =
        specsPayload?.items ||
        headerStyles?.paperPageSpecs ||
        []
      setPaperSpecs({
        items: specItems,
        byType: indexPaperSpecs(specItems),
        primaryTypes: specsPayload?.primaryTypes || [],
      })

      setSmartContext(sdCtx)
      setEditionCatalog(editionsResp)
      setApiHeaderStyles(headerStyles)
      if (headerStyles) setHeaderStyleCatalogCache(headerStyles)

      const editionItems = Array.isArray(editionsResp?.editions) ? editionsResp.editions : []
      setEditions(editionItems)

      const designs = []
      for (const ed of editionItems) {
        if (ed.editionDesign) designs.push(ed.editionDesign)
        for (const sub of ed.subEditions || []) {
          if (sub.design) designs.push(sub.design)
        }
      }
      setAllSmartDesigns(designs)

      setListMeta({
        contextDesigns: sdCtx?.totalDesigns ?? designs.length,
        contextEditions: sdCtx?.totalEditions ?? editionItems.length,
        editionsApiCount: editionItems.length,
        contextError: ctxError,
        editionsError,
      })

      if (!editionId && editionItems[0]?.id) setEditionId(String(editionItems[0].id))

      return { context: sdCtx, editions: editionItems }
    } catch (e) {
      setError(e?.message || String(e))
      return null
    } finally {
      setBusy(false)
      setInitialLoading(false)
    }
  }, [tenantId, editionId])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  const selectRowForEdit = useCallback(
    async (row) => {
      setScopeType(row.scopeType || 'edition')
      setEditionId(row.editionId || '')
      setSubEditionId(row.subEditionId || '')
      setNextAction(row.nextAction || (row.hasDesign ? 'UPDATE' : 'CREATE'))
      setInfo(`Editing: ${row.scopeLabel}`)
      setError('')
      await loadByEditionScope(row.editionId, row.subEditionId || '', row.scopeType || 'edition')
    },
    [loadByEditionScope]
  )

  const handleNewConfig = () => {
    setSelectedRowKey('')
    setSmartDesignId(null)
    setNextAction('CREATE')
    setForm({ ...EMPTY_FORM })
    setActiveDesign(null)
    setDesignToday(null)
    setInfo('New config — select edition scope below, then Save.')
    setError('')
  }

  useEffect(() => {
    if (!editionId || initialLoading) return
    if (scopeType === 'sub-edition' && !subEditionId) return
    loadByEditionScope(editionId, subEditionId, scopeType)
  }, [editionId, subEditionId, scopeType, initialLoading, loadByEditionScope])

  const reloadDesigns = useCallback(async () => {
    if (!tenantId) return
    try {
      const [editionsResp, sdCtx] = await Promise.all([
        smartDesignApi.getEditions(tenantId),
        smartDesignApi.getContext(tenantId).catch(() => null),
      ])
      setEditionCatalog(editionsResp)
      if (sdCtx) setSmartContext(sdCtx)
      const editionItems = editionsResp?.editions || []
      setEditions(editionItems)
      const designs = []
      for (const ed of editionItems) {
        if (ed.editionDesign) designs.push(ed.editionDesign)
        for (const sub of ed.subEditions || []) {
          if (sub.design) designs.push(sub.design)
        }
      }
      setAllSmartDesigns(designs)
      setListMeta((prev) => ({
        ...prev,
        contextDesigns: sdCtx?.totalDesigns ?? designs.length,
        contextEditions: sdCtx?.totalEditions ?? editionItems.length,
        editionsApiCount: editionItems.length,
        editionsError: '',
      }))
    } catch (e) {
      setListMeta((prev) => ({
        ...prev,
        editionsError: e?.message || String(e),
      }))
    }
  }, [tenantId])

  const handleSaveOneTime = async () => {
    if (!tenantId) return
    if (!isValidScopeSelection) {
      setError('First select edition/sub-edition.')
      return
    }

    setBusy(true)
    setError('')
    setInfo('')
    try {
      const payload = formToSmartDesignPayload(form, { editionId, subEditionId, scopeType })
      let savedDesign

      if (nextAction === 'UPDATE' && smartDesignId) {
        const updated = await smartDesignApi.patch(tenantId, smartDesignId, payload)
        savedDesign = updated?.design
        setInfo('Smart design updated (PATCH).')
      } else {
        const created = await smartDesignApi.create(tenantId, payload)
        savedDesign = created?.design
        setSmartDesignId(savedDesign?.id || null)
        setNextAction('UPDATE')
        setInfo('Smart design created (POST).')
      }

      await reloadDesigns()
      setSelectedRowKey(configKey)
      if (savedDesign) {
        syncFormFromConfig(savedDesign)
        setActiveDesign(savedDesign)
        setDesignToday(savedDesign.today || null)
      }
      setInfo((prev) => `${prev || ''} List refreshed.`)
    } catch (e) {
      if (e?.status === 409 && e?.data?.existingId) {
        setSmartDesignId(e.data.existingId)
        setNextAction('UPDATE')
        setError('Design already exists — reloading.')
        await loadByEditionScope(editionId, subEditionId, scopeType)
        await reloadDesigns()
      } else {
      setError(e?.message || String(e))
      }
    } finally {
      setBusy(false)
    }
  }

  const setTenantConfigField = (name, value) => {
    setTenantConfigForm((prev) => ({ ...(prev || newspaperConfigToForm({})), [name]: value }))
  }

  const handleSaveTenantNewsConfig = async () => {
    if (!tenantId || !tenantConfigForm) return
    setTenantConfigSaving(true)
    setError('')
    try {
      const body = formToNewspaperConfigPayload(tenantConfigForm)
      const saved = await epaperApi.putNewspaperConfig(tenantId, body)
      setTenantNewsConfig(saved)
      setTenantConfigForm(newspaperConfigToForm(saved))
      setInfo('Tenant newspaper-config saved (PUT /epaper/newspaper-config).')
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setTenantConfigSaving(false)
    }
  }

  const handleCollectNewsProbe = async () => {
    if (!tenantId || !editionId) {
      setError('Select an edition to probe collect-news.')
      return
    }
    setCollectBusy(true)
    setError('')
    setCollectSummary(null)
    try {
      const issueDate =
        designToday?.issueDate ||
        (form.issueStartDate ? String(form.issueStartDate).slice(0, 10) : '') ||
        new Date().toISOString().slice(0, 10)
      const query = {
        publicationEditionId: editionId,
        issueDate,
        excludeMainPage: 'true',
      }
      if (scopeType === 'sub-edition' && subEditionId) query.subEditionId = subEditionId
      const res = await smartDesignApi.collectNews(tenantId, query)
      const nw = res?.newsWindow || res?.pipeline?.newsWindow
      setCollectSummary({
        issueDate,
        articleCount: res?.articleCount ?? res?.articles?.length ?? res?.summary?.articleCount,
        newsWindow: nw,
      })
      setInfo('collect-news OK — print pipeline window (00:00–newsCloseTime IST).')
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setCollectBusy(false)
    }
  }

  const handleUploadImage = async (fieldKey, file) => {
    if (!tenantId || !file) return
    setUploading((prev) => ({ ...prev, [fieldKey]: true }))
    setError('')
    setInfo('')
    try {
      const folder = `tenants/${tenantId}/epaper/design-config`
      const result = await mediaApi.upload(file, folder)
      const internalUrl =
        result?.internalUrl ||
        result?.data?.internalUrl ||
        result?.data?.internalPath ||
        result?.url ||
        ''
      if (!internalUrl) throw new Error('Upload succeeded but URL is missing')
      setField(fieldKey, internalUrl)
      if (smartDesignId) {
        await smartDesignApi.patch(tenantId, smartDesignId, { [fieldKey]: internalUrl })
      }
      setInfo('Image uploaded. Internal URL saved to smart design.')
    } catch (e) {
      setError(e?.message || 'Image upload failed')
    } finally {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">ePaper Design Config</div>
            <div className="text-sm text-slate-500">
              Tenant: <span className="font-mono">{tenantId}</span>
              {smartContext?.tenantName ? (
                <span className="ml-2 text-slate-700">· {smartContext.tenantName}</span>
              ) : null}
            </div>
            {(smartContext?.epaperDomain || smartContext?.prgiNumber) ? (
              <div className="text-xs text-slate-500 mt-1">
                {smartContext.epaperDomain ? (
                  <>Domain: <span className="font-mono">{smartContext.epaperDomain}</span></>
                ) : (
                  <span className="text-amber-700">No ePaper domain</span>
                )}
                {smartContext.prgiNumber ? (
                  <span className="ml-3">
                    PRGI: <span className="font-mono">{smartContext.prgiNumber}</span>
                    {smartContext.prgiStatus ? (
                      <span className="ml-1 text-emerald-700">({smartContext.prgiStatus})</span>
                    ) : null}
                  </span>
                ) : null}
                <span className="ml-3">
                  Editions: {listMeta.contextEditions} · Designs: {listMeta.contextDesigns}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {layoutPreviewHref() ? (
              <Link
                href={layoutPreviewHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
              >
                Layout preview (P2+)
              </Link>
            ) : null}
            <Link
              href={`/admin/daily-newspaper-news?tenantId=${encodeURIComponent(tenantId || '')}`}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Reporter news (6am–midnight)
            </Link>
            <button
              type="button"
              onClick={loadAll}
              disabled={busy}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
            >
              {initialLoading ? 'Loading…' : 'Refresh tenant'}
            </button>
          </div>
        </div>

        {printNewsWindow ? (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-xs text-indigo-950">
            <div className="font-semibold text-sm mb-1">Today print news window (collect-news / smart-design)</div>
            <div className="font-mono">
              {printNewsWindow.fromDate || printNewsWindow.fromIST || '—'} →{' '}
              {printNewsWindow.toDate || printNewsWindow.toIST || '—'}
            </div>
            {designToday ? (
              <div className="mt-1 text-indigo-800">
                Vol {designToday.currentVolume ?? '—'} · Issue {designToday.currentIssue ?? '—'}
                {designToday.dayNameTelugu ? ` · ${designToday.dayNameTelugu}` : ''}
              </div>
            ) : tenantConfigForm?.todayVolume != null ? (
              <div className="mt-1 text-indigo-800">
                Tenant default — Vol {tenantConfigForm.todayVolume} · Issue {tenantConfigForm.todayIssue}
              </div>
            ) : null}
            <p className="mt-2 text-[11px] text-indigo-700 leading-relaxed">
              Desk reporter list (06:00–23:59 IST) uses{' '}
              <code className="bg-white/70 px-1 rounded">tenant-feed?timeRule=newsroom</code> — not this window.
            </p>
          </div>
        ) : null}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
        )}
        {info && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 whitespace-pre-wrap">{info}</div>
        )}

        {tenantConfigForm ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Tenant newspaper-config (default)</div>
                <div className="text-[11px] text-slate-600 font-mono">GET/PUT /epaper/newspaper-config · JWT + X-Tenant-Id</div>
              </div>
              <button
                type="button"
                onClick={handleSaveTenantNewsConfig}
                disabled={tenantConfigSaving || busy}
                className="px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-semibold disabled:opacity-60"
              >
                {tenantConfigSaving ? 'Saving…' : 'Save tenant config'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs text-slate-600">
                Page count
                <input
                  type="number"
                  min="1"
                  value={tenantConfigForm.pageCount ?? 8}
                  onChange={(e) => setTenantConfigField('pageCount', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </label>
              <label className="text-xs text-slate-600">
                News close (IST)
                <input
                  type="time"
                  value={tenantConfigForm.newsCloseTime || '23:00'}
                  onChange={(e) => setTenantConfigField('newsCloseTime', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </label>
              <label className="text-xs text-slate-600">
                Main / sub header #
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tenantConfigForm.headerStyleNumber ?? 1}
                    onChange={(e) => setTenantConfigField('headerStyleNumber', e.target.value)}
                    className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                    title="headerStyleNumber"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tenantConfigForm.subHeaderStyleNumber ?? 1}
                    onChange={(e) => setTenantConfigField('subHeaderStyleNumber', e.target.value)}
                    className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                    title="subHeaderStyleNumber"
                  />
                </div>
              </label>
              <label className="text-xs text-slate-600 md:col-span-3">
                Last page footer
                <input
                  type="text"
                  value={tenantConfigForm.lastPageFooterText || ''}
                  onChange={(e) => setTenantConfigField('lastPageFooterText', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </label>
              <ImageUrlField
                label="Main logo (mainLogoUrl)"
                hint="Tenant-wide fallback before edition smart-design"
                value={tenantConfigForm.mainLogoUrl || ''}
                onChange={(v) => setTenantConfigField('mainLogoUrl', v)}
                onUpload={async (file) => {
                  const folder = `tenants/${tenantId}/epaper/newspaper-config`
                  const result = await mediaApi.upload(file, folder)
                  const url =
                    result?.internalUrl ||
                    result?.data?.internalUrl ||
                    result?.url ||
                    ''
                  if (url) setTenantConfigField('mainLogoUrl', url)
                }}
                busy={tenantConfigSaving}
                uploading={false}
              />
              <ImageUrlField
                label="Sub header logo"
                value={tenantConfigForm.subHeaderLogoUrl || ''}
                onChange={(v) => setTenantConfigField('subHeaderLogoUrl', v)}
                onUpload={async (file) => {
                  const folder = `tenants/${tenantId}/epaper/newspaper-config`
                  const result = await mediaApi.upload(file, folder)
                  const url =
                    result?.internalUrl ||
                    result?.data?.internalUrl ||
                    result?.url ||
                    ''
                  if (url) setTenantConfigField('subHeaderLogoUrl', url)
                }}
                busy={tenantConfigSaving}
                uploading={false}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border-2 border-slate-200 bg-slate-50/50 p-4 min-h-[140px]">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-slate-900">Saved edition designs (table)</div>
              <div className="text-xs text-slate-600 mt-1 font-mono">
                GET /context → {listMeta.contextEditions} editions, {listMeta.contextDesigns} designs
                {listMeta.contextError ? (
                  <span className="text-red-600"> · context error: {listMeta.contextError}</span>
                ) : null}
                {' · '}
                GET /editions → {listMeta.editionsApiCount} rows
                {listMeta.editionsError ? (
                  <span className="text-amber-700"> · {listMeta.editionsError}</span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={handleNewConfig}
              className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + New edition
            </button>
          </div>
          {initialLoading ? (
            <div className="text-xs text-slate-500 py-6 text-center">Loading tenant &amp; designs…</div>
          ) : designTableRows.length ? (
            <div className="overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left py-2.5 px-3 font-semibold">Edition / scope</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Paper</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Pages</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Cost</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Headers</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Status</th>
                    <th className="text-left py-2.5 px-2 font-semibold">Vol / Issue</th>
                    <th className="text-right py-2.5 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {designTableRows.map((row) => {
                    const isActive = selectedRowKey === row.key
                    return (
                      <tr
                        key={row.key}
                        className={`border-t border-slate-100 ${isActive ? 'bg-amber-50/80' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{row.scopeLabel}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {row.id ? row.id.slice(0, 16) : row.source}
                          </div>
                        </td>
                        <td className="py-2.5 px-2">{row.pageSize || '—'}</td>
                        <td className="py-2.5 px-2">{row.defaultPageCount ?? '—'}</td>
                        <td className="py-2.5 px-2">₹{row.paperSellCost ?? '—'}</td>
                        <td className="py-2.5 px-2 text-[10px] leading-snug">
                          M{row.headerStyleNumber}: {mainStyleName(row.headerStyleNumber)}
                          <br />
                          S{row.subHeaderStyleNumber}: {subStyleName(row.subHeaderStyleNumber)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.hasDesign
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {row.hasDesign ? 'UPDATE' : 'CREATE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          {row.volumeNumber ?? '—'} / {row.issueNumber ?? '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() => selectRowForEdit(row)}
                              className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                                isActive
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-800 text-white hover:bg-slate-700'
                              }`}
                            >
                              {isActive ? 'Editing' : 'Edit'}
                            </button>
                            {row.hasDesign && layoutPreviewHref(row.editionId) ? (
                              <Link
                                href={layoutPreviewHref(row.editionId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-teal-700 hover:underline"
                              >
                                Preview P2+
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-600 py-6 px-4 text-center rounded-lg bg-white border-2 border-dashed border-amber-300">
              <div className="font-semibold text-amber-900 mb-2">No editions found for this tenant</div>
              <p className="text-xs leading-relaxed max-w-lg mx-auto">
                <strong>GET /context</strong> and <strong>GET /editions</strong> returned no publication editions.
                Create an edition in the tenant first, then return here to add ePaper smart design (POST).
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="text-sm font-semibold text-slate-900">
            {smartDesignId ? 'Edit design' : 'Create new design'} — Step 1: Edition scope
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={scopeType}
              onChange={(e) => {
                setScopeType(e.target.value)
                setSubEditionId('')
              }}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="edition">Edition</option>
              <option value="sub-edition">Sub-edition</option>
            </select>
            <select
              value={editionId}
              onChange={(e) => {
                setEditionId(e.target.value)
                setSubEditionId('')
              }}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">Select Edition</option>
              {editions.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name || ed.slug || ed.id}
                </option>
              ))}
            </select>
            <select
              value={subEditionId}
              onChange={(e) => setSubEditionId(e.target.value)}
              disabled={scopeType !== 'sub-edition'}
              className="px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
            >
              <option value="">Select Sub-edition</option>
              {availableSubEditions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name || sub.slug || sub.id}
                </option>
              ))}
            </select>
          </div>

          {nextAction === 'UPDATE' && smartDesignId ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Editing <strong>{selectedRowKey || configKey}</strong> · id{' '}
              <span className="font-mono">{smartDesignId}</span> — Save updates (PATCH).
            </div>
          ) : isValidScopeSelection ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              New scope <strong>{configKey}</strong> — Save creates (POST). One design per edition/sub-edition.
            </div>
          ) : (
            <div className="text-xs text-slate-500">Select edition scope to create or match a row above.</div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="text-sm font-semibold text-slate-900">Step 2: Design & pricing setup</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-600">
              Paper Type
              <select
                value={normalizePaperTypeKey(form.paperType || form.pageSize)}
                onChange={(e) => {
                  const v = e.target.value
                  setField('paperType', v)
                  setField('pageSize', v)
                }}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
              >
                {paperTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {activePaperSpec ? (
                <span className="block mt-1 text-[10px] text-slate-500 leading-snug">
                  {formatPaperSpecSummary(activePaperSpec)}
                </span>
              ) : null}
            </label>
            <label className="text-xs text-slate-600">
              Main header style
              <select
                value={form.headerStyleNumber}
                onChange={(e) => setField('headerStyleNumber', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
              >
                {mainHeaderOptions.map((s) => (
                  <option key={s.key || s.number} value={s.number}>
                    {s.number}. {s.name}
                    {s.htmlRenderer === 'full' ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Sub header style (P2+)
              <select
                value={form.subHeaderStyleNumber}
                onChange={(e) => setField('subHeaderStyleNumber', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
              >
                {subHeaderOptions.map((s) => (
                  <option key={s.key || s.number} value={s.number}>
                    {s.number}. {s.name}
                    {s.nameTe ? ` — ${s.nameTe}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {headerRenderHint ? (
            <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              {headerRenderHint}. Catalog:{' '}
              <code className="text-[10px]">GET /admin/epaper/header-styles</code> · Specs:{' '}
              <code className="text-[10px]">GET /epaper/paper-page-specs</code> · See{' '}
              <span className="font-mono">docs/EPAPER_DESIGN_INTEGRATION.md</span>
            </p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-600">
              Number of Pages
              <input
                type="number"
                min="1"
                value={form.defaultPageCount}
                onChange={(e) => setField('defaultPageCount', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600">
              Per Page Cost (monthly)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.perPageCostMonthly ?? form.perPagePrice}
                onChange={(e) => {
                  setField('perPageCostMonthly', e.target.value)
                  setField('perPagePrice', e.target.value)
                }}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600">
              Paper Cost
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.paperSellCost}
                onChange={(e) => setField('paperSellCost', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600">
              Today volume / issue (read-only)
              <input
                type="text"
                readOnly
                value={`${designToday?.currentVolume ?? form.volumeNumber ?? '—'} / ${designToday?.currentIssue ?? form.issueNumber ?? '—'}`}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-slate-100 text-slate-700"
              />
            </label>
            <label className="text-xs text-slate-600">
              Volume start # / year
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={form.volumeStartNumber ?? form.volumeNumber ?? 1}
                  onChange={(e) => setField('volumeStartNumber', e.target.value)}
                  disabled={busy}
                  className="w-full px-2 py-2 border rounded-lg text-sm disabled:bg-slate-100"
                />
                <input
                  type="number"
                  min="2000"
                  value={form.volumeStartYear ?? new Date().getFullYear()}
                  onChange={(e) => setField('volumeStartYear', e.target.value)}
                  disabled={busy}
                  className="w-full px-2 py-2 border rounded-lg text-sm disabled:bg-slate-100"
                />
              </div>
            </label>
            <label className="text-xs text-slate-600">
              Issue start # / date
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.issueStartNumber ?? form.issueNumber ?? 1}
                  onChange={(e) => setField('issueStartNumber', e.target.value)}
                  disabled={busy}
                  className="w-24 px-2 py-2 border rounded-lg text-sm disabled:bg-slate-100"
                />
                <input
                  type="date"
                  value={form.issueStartDate || ''}
                  onChange={(e) => setField('issueStartDate', e.target.value)}
                  disabled={busy}
                  className="flex-1 px-2 py-2 border rounded-lg text-sm disabled:bg-slate-100"
                />
              </div>
            </label>
            <label className="text-xs text-slate-600">
              Issue counter
              <select
                value={form.issueCounterMode || 'SEQUENTIAL'}
                onChange={(e) => setField('issueCounterMode', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white disabled:bg-slate-100"
              >
                <option value="SEQUENTIAL">SEQUENTIAL (daily +1)</option>
                <option value="DAY_OF_YEAR">DAY_OF_YEAR (1–365)</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              News close time (IST)
              <input
                type="time"
                value={form.newsCloseTime || '23:00'}
                onChange={(e) => setField('newsCloseTime', e.target.value)}
                disabled={busy}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600 md:col-span-2">
              Header data (masthead text — optional for image-only styles)
              <input
                type="text"
                value={form.headerData || ''}
                onChange={(e) => setField('headerData', e.target.value)}
                disabled={busy}
                placeholder="తెలుగుప్రభ"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600 md:col-span-3">
              Published area (P1 info bar)
              <input
                type="text"
                value={form.publishedAreaText || ''}
                onChange={(e) => setField('publishedAreaText', e.target.value)}
                disabled={busy}
                placeholder="Hyderabad • Warangal"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600 md:col-span-3">
              Last page footer text
              <input
                type="text"
                value={form.lastPageFooterText || ''}
                onChange={(e) => setField('lastPageFooterText', e.target.value)}
                disabled={busy}
                placeholder="Printed at Hyderabad"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
              />
            </label>
            <div className="md:col-span-3 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
              Main header images (page 1)
            </div>
            {allowedUploadFields.headerLogoUrl !== false ? (
              <ImageUrlField
                label="Center logo (headerLogoUrl)"
                hint="Style 1 center — image only on preview"
                value={form.headerLogoUrl || form.paperNameImageUrl}
                onChange={(v) => {
                  setField('headerLogoUrl', v)
                  setField('paperNameImageUrl', v)
                }}
                onUpload={(file) => handleUploadImage('headerLogoUrl', file)}
                busy={busy}
                uploading={uploading.headerLogoUrl}
              />
            ) : null}
            {allowedUploadFields.headerLeftImageUrl !== false ? (
              <ImageUrlField
                label="Left column image"
                hint="Ads / custom — headerLeftImageUrl"
                value={form.headerLeftImageUrl}
                onChange={(v) => setField('headerLeftImageUrl', v)}
                onUpload={(file) => handleUploadImage('headerLeftImageUrl', file)}
                busy={busy}
                uploading={uploading.headerLeftImageUrl}
              />
            ) : null}
            {allowedUploadFields.headerRightImageUrl !== false ? (
              <ImageUrlField
                label="Right column image"
                hint="Article thumb / right ad"
                value={form.headerRightImageUrl}
                onChange={(v) => setField('headerRightImageUrl', v)}
                onUpload={(file) => handleUploadImage('headerRightImageUrl', file)}
                busy={busy}
                uploading={uploading.headerRightImageUrl}
              />
            ) : null}

            <div className="md:col-span-3 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
              Sub header (page 2+)
            </div>
            {allowedUploadFields.subHeaderLogoUrl !== false ? (
              <ImageUrlField
                label="Center logo"
                hint="Style 1: page · logo · date — leave empty to use main center logo"
                value={form.subHeaderLogoUrl}
                onChange={(v) => setField('subHeaderLogoUrl', v)}
                onUpload={(file) => handleUploadImage('subHeaderLogoUrl', file)}
                busy={busy}
                uploading={uploading.subHeaderLogoUrl}
              />
            ) : null}
            <ImageUrlField
              label="Full strip image (optional)"
              hint="Replaces entire sub-header layout when set"
              value={form.subHeaderImageUrl}
              onChange={(v) => setField('subHeaderImageUrl', v)}
              onUpload={(file) => handleUploadImage('subHeaderImageUrl', file)}
              busy={busy}
              uploading={uploading.subHeaderImageUrl}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCollectNewsProbe}
                disabled={collectBusy || !editionId}
                className="px-4 py-2 rounded-lg border border-teal-300 text-teal-900 text-xs font-semibold disabled:opacity-60"
              >
                {collectBusy ? 'Probing…' : 'Test collect-news'}
              </button>
              {collectSummary ? (
                <span className="text-[11px] text-slate-600">
                  {collectSummary.issueDate}: {collectSummary.articleCount ?? '?'} articles in pipeline window
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSaveOneTime}
              disabled={busy || !isValidScopeSelection}
              className="px-5 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60"
            >
              {nextAction === 'UPDATE' && smartDesignId ? 'Update Smart Design (PATCH)' : 'Create Smart Design (POST)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
