import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getToken } from '../../utils/auth';
import { articleService } from '../../lib/api/services/articleService';
import { tenantsApi } from '../../lib/api/tenantApi';
import { Spinner } from '../ui/Spinner';
import { Toast } from '../ui/Toast';
import { Tabs } from '../ui/Tabs';

export default function ArticlesListView() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [status, setStatus] = useState('PUBLISHED');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Data
  const [articles, setArticles] = useState({
    all: { newspaper: { items: [], total: 0 }, web: { items: [], total: 0 }, shortNews: { items: [], total: 0 } },
    newspaper: { items: [], total: 0, page: 1, limit: 20 },
    web: { items: [], total: 0, page: 1, limit: 20 },
    shortNews: { items: [], total: 0, page: 1, limit: 20 }
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selected article for detail view
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Tenant data
  const [tenants, setTenants] = useState([]);
  const [categories, setCategories] = useState([]);

  // Helper function to check if user is super admin
  const isSuperAdmin = (userData) => {
    if (!userData) return false;
    const role = userData.role?.name || userData.roleName || userData.role;
    const normalizedRole = String(role).toUpperCase().replace(/[_\s-]/g, '');
    return normalizedRole === 'SUPERADMIN' || normalizedRole === 'ADMIN';
  };

  // Get tenant ID from URL query (passed from create article page)
  const queryTenantId = router.query?.tenantId;

  useEffect(() => {
    const tokenData = getToken();
    
    if (tokenData?.user || tokenData?.data?.user) {
      const userData = tokenData.user || tokenData.data?.user;
      setUser(userData);
      
      if (isSuperAdmin(userData)) {
        // Super admin: Always fetch tenants from API (not in login response)
        fetchTenantsFromApi();
      } else {
        // Non-admin: Use tenants from login response
        const loginResponse = tokenData.data?.loginResponse || userData.loginResponse;
        const userTenants = loginResponse?.tenants || [];
        
        const userTenant = userTenants?.[0];
        if (userTenant) {
          setTenants([userTenant]);
          setSelectedTenant(userTenant);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tenants are loaded and queryTenantId exists, auto-select that tenant
  useEffect(() => {
    if (queryTenantId && tenants.length > 0) {
      const matchingTenant = tenants.find(t => t.id === queryTenantId);
      if (matchingTenant) {
        setSelectedTenant(matchingTenant);
      }
    }
  }, [queryTenantId, tenants]);

  const fetchTenantsFromApi = async () => {
    try {
      const response = await tenantsApi.list(true);
      const tenantsList = Array.isArray(response) ? response : (response?.data || response?.items || []);
      
      setTenants(tenantsList);
      
      // Check if there's a tenant ID from URL query, otherwise auto-select first
      if (tenantsList.length > 0 && !queryTenantId) {
        setSelectedTenant(tenantsList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setToast({ type: 'error', message: 'Failed to load tenants' });
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchCategories();
      fetchArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  useEffect(() => {
    if (selectedTenant) {
      fetchArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status, selectedCategory, fromDate, toDate, currentPage]);

  const fetchCategories = async () => {
    if (!selectedTenant) return;
    
    try {
      console.log('📚 Fetching categories for tenant:', selectedTenant.id);
      const response = await articleService.getCategories(selectedTenant.id);
      const categoriesList = Array.isArray(response) ? response : (response?.data || []);
      console.log('✅ Fetched categories:', categoriesList.length);
      setCategories(categoriesList);
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
    }
  };

  const fetchArticles = async () => {
    if (!selectedTenant) return;

    setLoading(true);
    try {
      const typeMap = {
        all: 'all',
        newspaper: 'newspaper',
        web: 'web',
        shortNews: 'shortNews'
      };

      const params = {
        tenantId: selectedTenant.id,
        type: typeMap[activeTab],
        status,
        page: currentPage,
        limit: 20,
        sortOrder: 'desc'
      };

      // Only add filters if they are set
      if (selectedCategory) params.categoryId = selectedCategory;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await articleService.getUnifiedArticles(params);

      console.log('📊 API Response for tab:', activeTab, response);

      if (response.success && response.data) {
        if (activeTab === 'all') {
          // For 'all' tab, store the full structure
          setArticles(prev => ({
            ...prev,
            all: response.data
          }));
        } else {
          // For specific tabs (newspaper, web, shortNews), extract the specific data
          const tabData = response.data[activeTab] || response.data;
          console.log('📊 Tab data for', activeTab, ':', tabData);
          setArticles(prev => ({
            ...prev,
            [activeTab]: tabData
          }));
        }
      }
    } catch (error) {
      console.error('Fetch articles error:', error);
      setToast({ type: 'error', message: error.message || 'Failed to fetch articles' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleViewArticle = (article) => {
    // Open article detail modal
    setSelectedArticle(article);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'all') {
      const allData = articles.all || { newspaper: { items: [], total: 0 }, web: { items: [], total: 0 }, shortNews: { items: [], total: 0 } };
      // Combine all items
      const allItems = [
        ...(allData.newspaper?.items || []).map(item => ({ ...item, type: 'newspaper' })),
        ...(allData.web?.items || []).map(item => ({ ...item, type: 'web' })),
        ...(allData.shortNews?.items || []).map(item => ({ ...item, type: 'shortNews' }))
      ];
      const allTotal = (allData.newspaper?.total || 0) + (allData.web?.total || 0) + (allData.shortNews?.total || 0);
      return { items: allItems, total: allTotal, page: currentPage, limit: 20 };
    }
    return articles[activeTab] || { items: [], total: 0, page: 1, limit: 20 };
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.total / currentData.limit);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
        <p className="text-gray-600 mt-1">Manage and view all articles</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Tenant Selection (Super Admin only) */}
          {isSuperAdmin(user) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant {tenants.length > 0 && `(${tenants.length})`}
              </label>
              <select
                value={selectedTenant?.id || ''}
                onChange={(e) => {
                  const tenant = tenants.find(t => t.id === e.target.value);
                  console.log('🔄 Tenant changed to:', tenant?.name);
                  setSelectedTenant(tenant);
                  setSelectedCategory(''); // Reset category when tenant changes
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select tenant...</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedTenant}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name || category.translatedName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PUBLISHED">Published</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          {/* From Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date (Optional)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Select start date..."
            />
          </div>

          {/* To Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date (Optional)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Select end date..."
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 All ({((articles.all?.newspaper?.total || 0) + (articles.all?.web?.total || 0) + (articles.all?.shortNews?.total || 0))})
            </button>
            <button
              onClick={() => handleTabChange('newspaper')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'newspaper'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📰 Newspaper ({articles.newspaper?.total || 0})
            </button>
            <button
              onClick={() => handleTabChange('web')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'web'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌐 Web ({articles.web?.total || 0})
            </button>
            <button
              onClick={() => handleTabChange('shortNews')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'shortNews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📱 Short News ({articles.shortNews?.total || 0})
            </button>
          </nav>
        </div>

        {/* Articles List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : currentData.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No articles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentData.items.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleViewArticle(article)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Featured Image */}
                    {(article.featuredImageUrl || article.coverImageUrl) && (
                      <div className="flex-shrink-0 relative w-24 h-24">
                        <Image
                          src={article.featuredImageUrl || article.coverImageUrl}
                          alt={article.title || article.heading}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {article.title || article.heading}
                        </h3>
                        {/* Category Badge */}
                        {(article.category?.name || article.categoryName || article.categories?.[0]?.name) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            📁 {article.category?.name || article.categoryName || article.categories?.[0]?.name}
                          </span>
                        )}
                        {activeTab === 'all' && article.type && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            article.type === 'newspaper' 
                              ? 'bg-purple-100 text-purple-800'
                              : article.type === 'web'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {article.type === 'newspaper' ? '📰 Print' : article.type === 'web' ? '🌐 Web' : '📱 Short'}
                          </span>
                        )}
                      </div>
                      
                      {article.slug && (
                        <p className="text-sm text-gray-500 mb-2">/{article.slug}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          article.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800'
                            : article.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {article.status}
                        </span>
                        
                        {article.author && (
                          <span>👤 {article.author.mobileNumber}</span>
                        )}
                        
                        <span>📅 {formatDate(article.createdAt)}</span>
                        
                        {article.publishedAt && (
                          <span>✅ {formatDate(article.publishedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewArticle(article); }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages} ({currentData.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
}

// Article Detail Modal Component
function ArticleDetailModal({ article, onClose }) {
  if (!article) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get content from various possible fields
  const content = article.content || article.body || article.contentHtml || '';
  const summary = article.summary || article.excerpt || article.shortDescription || '';
  const images = article.images || [];
  const featuredImage = article.featuredImageUrl || article.coverImageUrl || images[0] || '';
  const categoryName = article.category?.name || article.categoryName || article.categories?.[0]?.name || '-';
  const articleType = article.type || 'web';
  const h1 = article.h1 || article.contentJson?.h1 || '';
  const h2 = article.h2 || article.contentJson?.h2 || '';
  const sections = article.sections || article.contentJson?.sections || [];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b bg-gray-50">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-lg text-gray-900 truncate">{article.title || article.heading || 'Article'}</div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                articleType === 'newspaper' 
                  ? 'bg-purple-100 text-purple-800'
                  : articleType === 'web'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {articleType === 'newspaper' ? '📰 Print' : articleType === 'web' ? '🌐 Web' : '📱 Short'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                📁 {categoryName}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                article.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800'
                  : article.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {article.status}
              </span>
            </div>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors" 
            onClick={onClose}
          >
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Featured Image */}
          {featuredImage && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={featuredImage}
                alt={article.title || article.heading}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium">Created</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(article.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium">Published</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(article.publishedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium">Author</div>
              <div className="text-sm font-medium text-gray-900">{article.author?.name || article.author?.mobileNumber || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium">Views</div>
              <div className="text-sm font-medium text-gray-900">{article.viewCount || article.views || 0}</div>
            </div>
          </div>

          {/* H1/H2 Headlines */}
          {(h1 || h2) && (
            <div className="space-y-2">
              {h1 && <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>}
              {h2 && <h2 className="text-lg text-gray-700">{h2}</h2>}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Summary</div>
              <p className="text-gray-600 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
                {summary}
              </p>
            </div>
          )}

          {/* Sections */}
          {sections.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Content Sections</div>
              {sections.map((section, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  {section.heading && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.heading}</h3>
                  )}
                  {Array.isArray(section.paragraphs) && section.paragraphs.map((para, pIndex) => (
                    <p key={pIndex} className="text-gray-700 mb-2">{para}</p>
                  ))}
                  {typeof section.content === 'string' && (
                    <p className="text-gray-700">{section.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          {content && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Content</div>
              {typeof content === 'string' && content.includes('<') ? (
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: content }} 
                />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
              )}
            </div>
          )}

          {/* Additional Images */}
          {images.length > 1 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Images ({images.length})</div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={typeof img === 'string' ? img : img.url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(typeof img === 'string' ? img : img.url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Tags</div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{typeof tag === 'string' ? tag.trim() : tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Slug */}
          {article.slug && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">URL Slug</div>
              <code className="block bg-gray-100 px-3 py-2 rounded text-sm text-gray-700 font-mono">
                /{article.slug}
              </code>
            </div>
          )}

          {/* Location */}
          {(article.location || article.dateline) && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">Location / Dateline</div>
              <p className="text-gray-700">
                📍 {article.dateline || article.location?.inputText || JSON.stringify(article.location)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 px-6 flex items-center justify-end border-t bg-gray-50 gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
