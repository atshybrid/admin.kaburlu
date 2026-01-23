/**
 * Post Article Component - Step-based AI Article Creation
 * Step 1: Raw text input → AI processing
 * Step 2: Review AI response → Edit fields
 * Step 3: Final submission to backend
 */

import { useState, useEffect } from 'react'
import { articleService } from '../../lib/api/services/articleService'
import { aiArticleService } from '../../lib/api/services/aiArticleService'
import { locationService } from '../../lib/api/services/locationService'
import { tenantsApi } from '../../lib/api/tenantApi'
import { getToken } from '../../utils/auth'

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

function isSuperAdmin(user) {
  const role = normalizeRole(user)
  return role === 'SUPERADMIN' || role === 'ADMIN'
}

export default function PostArticle({ user: propUser, onSuccess, onCancel }) {
  const [user, setUser] = useState(propUser || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1)

  // Tenant data
  const [tenants, setTenants] = useState([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [tenantData, setTenantData] = useState(null)
  const [categories, setCategories] = useState([])
  const [languages, setLanguages] = useState([])
  
  // Step 1: Raw input
  const [rawText, setRawText] = useState('')
  const [processingAI, setProcessingAI] = useState(false)
  
  // Step 2: AI Response
  const [aiResponse, setAiResponse] = useState(null)
  
  // Step 3: Final form
  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    categoryId: '',
    languageCode: 'te',
    tags: '',
    imageUrl: '',
    status: 'DRAFT',
    location: '',
    newsType: ''
  })

  // Location resolution
  const [locationData, setLocationData] = useState(null)
  const [searchingLocation, setSearchingLocation] = useState(false)

  // Media requirements from AI
  const [mediaRequirements, setMediaRequirements] = useState([])
  const [uploadedImages, setUploadedImages] = useState({})
  const [uploadingImage, setUploadingImage] = useState(null)

  // Get user on mount or from props
  useEffect(() => {
    if (propUser) {
      setUser(propUser)
      
      if (!isSuperAdmin(propUser)) {
        const userTenantId = propUser.tenantId || propUser.tenant?.id
        if (userTenantId) {
          setSelectedTenant(userTenantId)
        }
      }
    } else {
      const tokenData = getToken()
      if (tokenData?.user || tokenData?.data?.user) {
        const userData = tokenData.user || tokenData.data?.user
        setUser(userData)
        
        if (!isSuperAdmin(userData)) {
          const userTenantId = userData.tenantId || userData.tenant?.id
          if (userTenantId) {
            setSelectedTenant(userTenantId)
          }
        }
      }
    }
  }, [propUser])

  // Load tenants for super admin
  useEffect(() => {
    if (user && isSuperAdmin(user)) {
      loadTenants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Load tenant data when selected
  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant])

  const loadTenants = async () => {
    try {
      console.log('📥 Loading tenants list for super admin...')
      
      // Try to get from login response first
      const tokenData = getToken()
      const loginResponse = tokenData?.data?.loginResponse || tokenData?.user?.loginResponse
      const userTenants = loginResponse?.tenants || []
      
      if (userTenants.length > 0) {
        console.log('✅ Using tenants from login response:', userTenants.length)
        setTenants(userTenants)
        
        if (!selectedTenant) {
          setSelectedTenant(userTenants[0].id)
        }
      } else {
        console.log('🔄 Fetching tenants from API...')
        const data = await tenantsApi.list(true)
        const tenantsList = Array.isArray(data) ? data : (data?.data || data?.items || [])
        console.log('✅ Fetched tenants from API:', tenantsList.length)
        
        setTenants(tenantsList)
        
        if (tenantsList.length > 0 && !selectedTenant) {
          setSelectedTenant(tenantsList[0].id)
        }
      }
    } catch (err) {
      console.error('❌ Failed to load tenants:', err)
      setError(`Failed to load tenants: ${err.message || err}`)
    }
  }

  const loadTenantData = async (tenantId) => {
    try {
      console.log('📥 Loading tenant data for:', tenantId)
      
      // Try to find tenant in the already-loaded tenants list first (has full data with entity)
      const existingTenant = tenants.find(t => t.id === tenantId)
      if (existingTenant && existingTenant.entity) {
        console.log('✅ Using tenant from list (has entity):', existingTenant.name)
        setTenantData(existingTenant)
        
        // Fetch categories and languages (pass tenant data directly)
        await loadCategoriesAndLanguages(tenantId, existingTenant)
        return
      }
      
      // For Tenant Admin/Reporter, try using data from login response first
      const tokenData = getToken()
      const loginResponse = tokenData?.data?.loginResponse || tokenData?.user?.loginResponse
      const userTenants = loginResponse?.tenants || []
      
      console.log('🔍 User tenants from login:', userTenants.length, userTenants.map(t => ({ id: t.id, name: t.name })))
      
      const userTenant = userTenants.find(t => t.id === tenantId || t.tenantId === tenantId)
      
      let tenantDetails = null
      
      // If user's tenant and data available in login response, use it
      if (userTenant && userTenant.entity) {
        console.log('✅ Using tenant data from login response:', userTenant.name)
        tenantDetails = userTenant
      } else {
        // Otherwise fetch from API
        console.log('🔄 Fetching tenant data from API for ID:', tenantId)
        try {
          const apiResult = await tenantsApi.get(tenantId)
          console.log('✅ API result:', apiResult)
          tenantDetails = apiResult?.data || apiResult
        } catch (apiErr) {
          console.error('❌ API fetch failed:', apiErr)
          // If API fails but we have basic tenant info from login, use that
          if (userTenant) {
            console.log('⚠️ Falling back to basic tenant info from login')
            tenantDetails = userTenant
          } else {
            throw apiErr
          }
        }
      }

      console.log('📦 Final tenant details:', tenantDetails)
      
      // Ensure tenant data has entity (API returns entity as nested object)
      if (tenantDetails && !tenantDetails.entity && tenantDetails.id) {
        console.warn('⚠️ Tenant data missing entity, may cause issues')
      }
      
      setTenantData(tenantDetails)

      // Fetch categories and languages (pass tenant data directly)
      await loadCategoriesAndLanguages(tenantId, tenantDetails)
    } catch (err) {
      console.error('❌ Failed to load tenant data:', err)
      setError(`Failed to load tenant data: ${err.message || err}`)
    }
  }

  const loadCategoriesAndLanguages = async (tenantId, tenantDetails = null) => {
    try {
      // Always fetch categories and languages (not in login response)
      console.log('📚 Fetching categories and languages...')
      const [categoriesData, languagesData] = await Promise.all([
        articleService.getCategories(tenantId),
        articleService.getLanguages()
      ])

      const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || [])
      const languagesList = Array.isArray(languagesData) ? languagesData : (languagesData?.data || [])
      
      console.log('✅ Categories:', categoriesList.length, 'Languages:', languagesList.length)
      
      setCategories(categoriesList)
      setLanguages(languagesList)

      if (categoriesList.length > 0 && !form.categoryId) {
        setForm(prev => ({ ...prev, categoryId: categoriesList[0].id }))
      }
      
      // Use tenant's language code from entity data (use passed tenant details or state)
      if (languagesList.length > 0) {
        const currentTenant = tenantDetails || tenantData
        const entityData = currentTenant?.entity || currentTenant
        const tenantLanguageCode = entityData?.language?.code || languagesList[0]?.code || 'te'
        console.log('🌐 Tenant entity data:', entityData)
        console.log('🌐 Setting language to tenant language:', tenantLanguageCode)
        setForm(prev => ({ ...prev, languageCode: tenantLanguageCode }))
      }
    } catch (err) {
      console.error('❌ Failed to load categories/languages:', err)
      // Don't throw, just log - categories/languages are not critical for initial load
    }
  }

  // Step 1: Process raw text with AI
  const handleProcessAI = async () => {
    setError('')
    
    if (!rawText.trim()) {
      setError('Please enter article text')
      return
    }

    if (!selectedTenant) {
      setError('Please select a tenant')
      return
    }

    if (!tenantData?.id) {
      setError('Tenant data not loaded properly')
      return
    }

    // Check if entity data is available (needed for AI processing)
    const entityData = tenantData.entity || tenantData
    if (!entityData.nativeName && !entityData.name) {
      setError('Tenant entity data is incomplete. Please ensure tenant is properly configured.')
      return
    }

    setProcessingAI(true)

    try {
      // Prepare payload for AI API
      const categoryNames = categories.map(cat => cat.name || cat.translatedName).filter(Boolean)
      const languageData = entityData.language || {}
      const stateData = entityData.state || {}
      
      const aiPayload = {
        rawText: rawText.trim(),
        categories: categoryNames,
        newspaperName: entityData.nativeName || tenantData.name || '',
        language: {
          code: languageData.code || 'te',
          name: languageData.name || 'Telugu',
          script: languageData.name || 'Telugu',
          region: stateData.name || null
        },
        temperature: 0.2,
        model: '5.2'
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 STEP 1: AI REWRITE REQUEST')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔗 Endpoint: POST /ai/rewrite/unified')
      console.log('📦 Payload:', JSON.stringify(aiPayload, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Call AI rewrite API with exact payload format
      const response = await aiArticleService.rewrite(aiPayload)

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 STEP 2: AI REWRITE RESPONSE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ Response:', JSON.stringify(response, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      setAiResponse(response)

      // Extract media requirements if available
      if (response.media_requirements?.must_photos) {
        setMediaRequirements(response.media_requirements.must_photos)
        console.log('📸 Media Requirements:', response.media_requirements.must_photos)
      }

      // Pre-fill form with AI response
      // Handle both old format and new unified format
      const printArticle = response.print_article || response
      const webArticle = response.web_article || response
      const shortArticle = response.short_mobile_article || response
      
      // Get language code from AI response
      const responseLanguageCode = response.language?.code || aiPayload.language?.code || form.languageCode
      
      setForm(prev => ({
        ...prev,
        // Title from print headline (preferred) or fallback to response.title
        title: printArticle.headline || response.title || response.headline || '',
        
        // Content from print body (array) or fallback
        content: Array.isArray(printArticle.body) 
          ? printArticle.body.join('\n\n')
          : (response.content || response.body || ''),
        
        // Summary from web lead or subtitle or fallback
        summary: webArticle.lead || printArticle.subtitle || response.summary || response.excerpt || '',
        
        // Tags from web SEO keywords or response tags
        tags: Array.isArray(webArticle.seo?.keywords)
          ? webArticle.seo.keywords.join(', ')
          : (Array.isArray(response.tags) ? response.tags.join(', ') : (response.tags || '')),
        
        // Location from print dateline place or fallback
        location: printArticle.dateline?.place || response.location || '',
        
        // News Type from print news_type or detected category
        newsType: printArticle.news_type || response.detected_category || response.newsType || response.category || '',
        
        // Language from AI request/response (maintain the language used in AI processing)
        languageCode: responseLanguageCode,
        
        // Auto-set status to PUBLISHED
        status: 'PUBLISHED'
      }))

      // Auto-match category
      const categoryToMatch = response.detected_category || response.selected_category?.name || response.category
      if (categoryToMatch) {
        const matchedCat = categories.find(cat => 
          cat.name?.toLowerCase() === categoryToMatch?.toLowerCase() ||
          cat.translatedName?.toLowerCase() === categoryToMatch?.toLowerCase()
        )
        if (matchedCat) {
          setForm(prev => ({ ...prev, categoryId: matchedCat.id }))
        }
      }

      // Auto-search location if available
      const locationToSearch = printArticle.dateline?.place || response.location
      if (locationToSearch && selectedTenant) {
        searchLocation(locationToSearch, selectedTenant)
      }

      setStep(2)
      setSuccess('✨ AI processing complete! Review and edit below.')
    } catch (err) {
      console.error('❌ AI Error:', err)
      setError(err.message || 'AI processing failed')
    } finally {
      setProcessingAI(false)
    }
  }

  // Search location in background
  const searchLocation = async (locationText, tenantId) => {
    if (!locationText || !tenantId) return

    setSearchingLocation(true)
    try {
      const searchResult = await locationService.search(locationText, tenantId, 20)
      const bestMatch = locationService.getBestMatch(searchResult)
      
      if (bestMatch) {
        const resolved = locationService.buildResolvedLocation(bestMatch)
        const dateline = locationService.formatDateline(bestMatch, form.languageCode)
        
        setLocationData({
          inputText: locationText,
          resolved,
          dateline
        })
        
        console.log('📍 Location Resolved:', {
          input: locationText,
          matched: dateline?.placeName
        })
      }
    } catch (err) {
      console.error('Location search failed:', err)
      // Don't show error to user, location is optional
    } finally {
      setSearchingLocation(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (photoId, file) => {
    if (!file) return

    setUploadingImage(photoId)
    try {
      // Get requirement metadata for this photo
      const requirement = mediaRequirements.find(req => req.id === photoId)
      
      // Prepare metadata
      const metadata = {
        key: requirement?.alt_suggestion?.en || file.name,  // Alt text (English)
        filename: requirement?.caption_suggestion?.te || file.name,  // Caption (Telugu)
        kind: 'image'
      }

      console.log('📤 Uploading image:', { photoId, metadata })

      // Upload using new media API
      const result = await articleService.uploadMedia(file, metadata)

      console.log('✅ Image Uploaded:', { photoId, url: result.url })

      // Store uploaded image with metadata
      setUploadedImages(prev => ({
        ...prev,
        [photoId]: {
          url: result.url,  // publicUrl from CDN
          file: file.name,
          key: result.key,
          caption: metadata.filename,
          alt: metadata.key
        }
      }))

      setSuccess(`✓ Image uploaded successfully!`)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      console.error('❌ Upload Error:', err)
      setError(`Failed to upload image: ${err.message}`)
    } finally {
      setUploadingImage(null)
    }
  }

  // Step 2/3: Submit final article with unified API
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedTenant) {
      setError('Tenant is required')
      return
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required')
      return
    }

    if (!form.categoryId) {
      setError('Please select a category')
      return
    }

    setLoading(true)

    try {
      // Get selected category details
      const selectedCategory = categories.find(c => c.id === form.categoryId)
      
      // Get domain ID from tenant
      const primaryDomain = tenantData?.domains?.find(d => d.isPrimary)
      const domainId = primaryDomain?.id || null
      
      // Check if we have AI unified response structure
      const hasUnifiedResponse = aiResponse?.print_article && aiResponse?.web_article
      
      let bodyParagraphs, highlights, webSections, seoData, shortNewsData

      if (hasUnifiedResponse) {
        // Use AI unified structure
        bodyParagraphs = aiResponse.print_article.body || form.content.trim().split('\n\n').filter(Boolean)
        highlights = aiResponse.print_article.highlights || []
        
        webSections = [{
          subhead: aiResponse.web_article.subheads?.[0] || '',
          paragraphs: aiResponse.web_article.body || bodyParagraphs
        }]
        
        seoData = {
          slug: aiResponse.web_article.seo?.url_slug || form.title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100),
          metaTitle: aiResponse.web_article.seo?.meta_title || form.title.trim(),
          metaDescription: aiResponse.web_article.seo?.meta_description || form.summary?.trim() || '',
          keywords: aiResponse.web_article.seo?.keywords || (form.tags ? form.tags.split(',').map(t => t.trim()) : [])
        }
        
        shortNewsData = {
          h1: aiResponse.short_mobile_article?.h1 || form.title.trim(),
          h2: aiResponse.short_mobile_article?.h2 || form.summary?.trim() || '',
          content: aiResponse.short_mobile_article?.body || bodyParagraphs.join('\n\n')
        }
      } else {
        // Fallback to manual split
        bodyParagraphs = form.content.trim().split('\n\n').filter(Boolean)
        highlights = []
        
        webSections = [{
          subhead: '',
          paragraphs: bodyParagraphs
        }]
        
        seoData = {
          slug: form.title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100),
          metaTitle: form.title.trim(),
          metaDescription: form.summary?.trim() || '',
          keywords: form.tags ? form.tags.split(',').map(t => t.trim()) : []
        }
        
        shortNewsData = {
          h1: form.title.trim(),
          h2: form.summary?.trim() || '',
          content: bodyParagraphs.join('\n\n')
        }
      }

      // Build media array from uploaded images + requirements
      const mediaImages = []
      
      // Add uploaded images with AI-suggested captions
      mediaRequirements.forEach(req => {
        const uploaded = uploadedImages[req.id]
        if (uploaded?.url) {
          mediaImages.push({
            url: uploaded.url,  // CDN URL from upload response
            caption: uploaded.caption || req.caption_suggestion?.te || '',  // Telugu caption
            alt: uploaded.alt || req.alt_suggestion?.en || ''  // English alt text
          })
        }
      })

      // Add manually uploaded image if any (from form)
      if (form.imageUrl && !mediaImages.find(img => img.url === form.imageUrl)) {
        mediaImages.push({
          url: form.imageUrl,
          caption: '',
          alt: form.title
        })
      }

      // Build unified article payload
      const unifiedPayload = {
        tenantId: selectedTenant,
        domainId: domainId || selectedTenant, // Fallback to tenantId if no domain
        
        baseArticle: {
          languageCode: form.languageCode || 'te',
          newsType: form.newsType || selectedCategory?.translatedName || selectedCategory?.name || 'News',
          category: {
            categoryId: form.categoryId,
            categoryName: selectedCategory?.translatedName || selectedCategory?.name || ''
          },
          publisher: {
            tenantId: selectedTenant,
            domainId: domainId || null,
            publisherId: null, // Will be set by backend
            publisherName: tenantData?.entity?.nativeName || tenantData?.name || ''
          }
        },

        location: locationData || {
          inputText: form.location || '',
          resolved: {
            village: {},
            mandal: {},
            district: {},
            state: {}
          },
          dateline: null
        },

        printArticle: {
          headline: form.title.trim(),
          subtitle: form.summary?.trim() || null,
          body: bodyParagraphs,
          highlights: highlights,
          responses: []
        },

        webArticle: {
          headline: hasUnifiedResponse ? aiResponse.web_article.headline : form.title.trim(),
          lead: hasUnifiedResponse ? aiResponse.web_article.lead : (form.summary?.trim() || bodyParagraphs[0] || ''),
          sections: webSections,
          seo: seoData
        },

        shortNews: shortNewsData,

        media: {
          images: mediaImages
        },

        publishControl: {
          publishReady: form.status === 'PUBLISHED',
          reason: form.status === 'DRAFT' ? 'Pending review' : 'Ready to publish'
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 STEP 3: CREATE UNIFIED ARTICLE REQUEST')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔗 Endpoint: POST /articles/unified')
      console.log('📦 Payload:', JSON.stringify(unifiedPayload, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      const result = await articleService.createUnified(unifiedPayload)
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 STEP 4: CREATE ARTICLE RESPONSE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ Result:', JSON.stringify(result, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      setSuccess('🎉 Article created successfully! (Print + Web + Short News)')
      
      // Reset
      setForm({
        title: '',
        content: '',
        summary: '',
        categoryId: categories[0]?.id || '',
        languageCode: 'te',
        tags: '',
        imageUrl: '',
        status: 'DRAFT',
        location: '',
        newsType: ''
      })
      setRawText('')
      setAiResponse(null)
      setLocationData(null)
      setMediaRequirements([])
      setUploadedImages({})
      setStep(1)

      if (onSuccess) {
        setTimeout(() => onSuccess(result), 1500)
      }
    } catch (err) {
      console.error('❌ Create Error:', err)
      setError(err.message || 'Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  const showTenantSelector = isSuperAdmin(user)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-200 px-8 py-6">
          <h2 className="text-2xl font-bold text-slate-900">Create New Article</h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 && 'Step 1: Paste raw article text for AI processing'}
            {step === 2 && 'Step 2: Review and edit AI-generated content'}
          </p>
          
          {/* Progress */}
          <div className="flex items-center gap-3 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-md' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {s}
                </div>
                <span className={`text-sm font-medium ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s === 1 ? 'Raw Input' : 'Review & Publish'}
                </span>
                {s < 2 && <div className="h-0.5 w-12 bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
            <span className="text-lg">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Raw Input */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            {showTenantSelector && (
              <div className="pb-6 border-b border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Publication <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  required
                >
                  <option value="">-- Select Publication --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.entity?.nativeName || t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {tenantData?.entity?.nativeName && `Selected: ${tenantData.entity.nativeName}`}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Raw Article Text <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                📝 Paste your unformatted article. AI will structure it automatically.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Example:&#10;అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇల్లు కేటాయింపు ప్రశ్న ఆయుధం, జనవరి 22: కూకట్‌పల్లి ప్రతినిధి ఫతేనగర్ డివిజన్ అమృత్ నగర్ తండావాసుల 40 ఏళ్ల స్వప్నం సాకారం కాబోతుంది..."
                rows={18}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none font-mono text-sm"
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  {rawText.length} characters • {rawText.split(/\s+/).filter(Boolean).length} words
                </p>
                {rawText.length > 100 && (
                  <span className="text-xs text-green-600 font-medium">✓ Ready for AI</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleProcessAI}
                disabled={processingAI || !selectedTenant || !rawText.trim()}
                className="px-8 py-3 bg-gradient-to-r from-brand to-brand-dark text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingAI && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {processingAI ? 'Processing with AI...' : '🤖 Process with AI →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review & Edit */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {aiResponse && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <span className="text-xl">✨</span> AI Processing Complete
                </h4>
                <p className="text-sm text-blue-700">
                  Your article has been structured. Review and edit before publishing.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Summary
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={14}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand resize-none font-mono text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                  required
                >
                  <option value="">-- Select --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.translatedName || cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Language
                </label>
                <select
                  value={form.languageCode}
                  onChange={(e) => setForm({ ...form, languageCode: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName || lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => {
                      const newLocation = e.target.value
                      setForm({ ...form, location: newLocation })
                      // Auto-search as user types
                      if (newLocation.length > 2 && selectedTenant) {
                        searchLocation(newLocation, selectedTenant)
                      }
                    }}
                    placeholder="కూకట్‌పల్లి, హైదరాబాద్"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                  />
                  {searchingLocation && (
                    <div className="absolute right-3 top-3">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-brand rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {locationData?.dateline && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {locationData.dateline.formatted}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  News Type
                </label>
                <input
                  type="text"
                  value={form.newsType}
                  onChange={(e) => setForm({ ...form, newsType: e.target.value })}
                  placeholder="Crime / Medical Negligence"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="politics, government, telangana"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Media Upload Section */}
            {mediaRequirements.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📸</span> Required Photos
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  AI suggests the following photos for your article:
                </p>
                <div className="space-y-4">
                  {mediaRequirements.map((req, index) => (
                    <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {req.photo_type}
                            </span>
                            {req.mandatory && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 font-medium">
                            {req.scene}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Caption: {req.caption_suggestion?.te || req.caption_suggestion?.en}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(req.id, file)
                          }}
                          disabled={uploadingImage === req.id}
                          className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark disabled:opacity-50"
                        />
                        {uploadingImage === req.id && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin" />
                            Uploading...
                          </div>
                        )}
                        {uploadedImages[req.id] && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <span>✓</span>
                            <span>{uploadedImages[req.id].file}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setSuccess('')
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                ← Back
              </button>
              
              <div className="flex items-center gap-3">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-brand to-brand-dark text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? 'Creating...' : '✓ Create Article'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
