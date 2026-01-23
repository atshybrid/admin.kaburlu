/**
 * Smart Article Drawer - AI-Powered Article Creation  
 * Simplified Flow: Tenant → RAW → AI → Auto-Post
 */

import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import { aiArticleService } from '../../lib/api/services/aiArticleService'
import Loader from '../Loader'

export default function SmartArticleDrawer({ onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [tenants, setTenants] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [loadingTenantData, setLoadingTenantData] = useState(false)
  const [publisherName, setPublisherName] = useState('')
  const [categories, setCategories] = useState([])
  const [languageCode, setLanguageCode] = useState('te')
  const [domainId, setDomainId] = useState('')
  const [rawText, setRawText] = useState('')
  const [processingAI, setProcessingAI] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoadingTenants(true)
      const t = getToken()
      const base = process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
      const res = await fetch(`${base}/api/v1/tenants`, {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      const json = await res.json().catch(() => [])
      const list = Array.isArray(json) ? json : (json?.data || [])
      setTenants(list)
    } catch (e) {
      setError('Failed to load tenants')
    } finally {
      setLoadingTenants(false)
    }
  }

  const handleTenantSelect = async (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId)
    if (!tenant) return
    setSelectedTenant(tenant)
    setError('')
    setLoadingTenantData(true)
    try {
      const t = getToken()
      const base = process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
      const nativeName = tenant.nativeName || tenant.name || ''
      setPublisherName(nativeName)
      const domain = aiArticleService.extractDomainId(tenant)
      setDomainId(domain || '')
      const lang = tenant.defaultLanguage || tenant.languageCode || 'te'
      setLanguageCode(lang)
      const res = await fetch(`${base}/api/v1/categories?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      const json = await res.json().catch(() => [])
      const categoryList = Array.isArray(json) ? json : (json?.data || [])
      setCategories(categoryList)
      setStep(2)
    } catch (e) {
      setError(`Failed to load tenant data: ${e.message}`)
    } finally {
      setLoadingTenantData(false)
    }
  }

  const handleAIProcess = async () => {
    if (!rawText.trim()) {
      setError('Please enter RAW news text')
      return
    }
    setError('')
    setSuccess('')
    setProcessingAI(true)
    setStep(3)
    try {
      const aiResponse = await aiArticleService.rewrite(rawText, selectedTenant.id, languageCode)
      let categoryId = ''
      if (aiResponse.detected_category) {
        const matched = categories.find(c => c.name?.toLowerCase().trim() === aiResponse.detected_category?.toLowerCase().trim())
        categoryId = matched?.id || ''
      }
      let locationData = null
      if (aiResponse.print_article?.dateline?.place) {
        try {
          const locationResults = await aiArticleService.searchLocation(aiResponse.print_article.dateline.place, selectedTenant.id, languageCode)
          if (locationResults && locationResults.length > 0) locationData = locationResults[0]
        } catch (e) {
          console.error('Location search failed:', e)
        }
      }
      const dateline = aiArticleService.buildDateline(locationData, aiResponse.print_article?.dateline?.date || '', publisherName)
      const payload = {
        tenantId: selectedTenant.id,
        domainId: domainId,
        languageCode: languageCode,
        categoryId: categoryId,
        title: aiResponse.print_article?.title || '',
        content: aiResponse.print_article?.paragraphs?.join('\n\n') || '',
        type: 'reporter',
        status: aiArticleService.getPublishStatus(aiResponse.internal_evidence?.completion_percentage || 0),
        dateline: dateline || undefined,
        publisher: publisherName ? { name: publisherName } : undefined,
        location: locationData ? { id: locationData.id, name: locationData.nativeName || locationData.name, type: locationData.type } : undefined,
        images: (aiResponse.media_requirements || []).map(media => ({
          scene: media.scene || '',
          caption: media.caption_suggestion?.te || media.caption_suggestion?.en || '',
          alt: media.alt_suggestion?.en || media.alt_suggestion?.te || '',
          url: ''
        })).filter(img => img.scene),
        aiMetadata: {
          completionPercentage: aiResponse.internal_evidence?.completion_percentage,
          detectedCategory: aiResponse.detected_category,
          rawText: rawText.substring(0, 500)
        }
      }
      const t = getToken()
      const base = process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
      const res = await fetch(`${base}/api/v1/articles/unified`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`API failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      const result = await res.json()
      setSuccess(`✅ Article created successfully! ID: ${result.id || 'N/A'}`)
      setTimeout(() => { if (onCreated) onCreated() }, 2000)
    } catch (e) {
      setError(e.message || 'Failed to process article')
      setStep(2)
    } finally {
      setProcessingAI(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={!processingAI ? onClose : undefined} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col">
        <div className="h-16 px-6 flex items-center justify-between border-b bg-gradient-to-r from-brand/5 to-transparent">
          <div>
            <div className="font-semibold text-lg">🤖 AI Article Creation</div>
            <div className="text-xs text-gray-500">Step {step} of 3</div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} disabled={processingAI || loadingTenantData}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
          {step === 1 && <div className="text-center py-8"><h2 className="text-xl font-bold mb-2">Select Tenant</h2><p className="text-sm text-gray-500 mb-6">Choose news organization</p>{loadingTenants ? <Loader size={48} /> : <div className="space-y-3">{tenants.map(t => <button key={t.id} onClick={() => handleTenantSelect(t.id)} className="w-full p-4 rounded-lg border-2 hover:border-brand"><div className="font-semibold">{t.nativeName || t.name}</div></button>)}</div>}</div>}
          {step === 2 && <div className="space-y-6"><div className="bg-blue-50 border p-4 rounded-lg"><div className="font-semibold">{publisherName}</div><div className="text-xs">{categories.length} categories</div></div><textarea rows={16} className="w-full border-2 rounded-lg p-4" placeholder="Enter raw news..." value={rawText} onChange={e => setRawText(e.target.value)} /><button onClick={handleAIProcess} disabled={!rawText.trim()} className="w-full py-4 rounded-lg bg-gradient-to-r from-brand to-brand-dark text-white font-semibold">🚀 Generate Article</button></div>}
          {step === 3 && processingAI && <div className="text-center py-16"><Loader size={48} /><h3 className="text-lg font-semibold mt-4">Processing...</h3></div>}
        </div>
      </div>
    </div>
  )
}
