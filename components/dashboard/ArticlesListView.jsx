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
  
  // Tenant data
  const [tenants, setTenants] = useState([]);

  // Helper function to check if user is super admin
  const isSuperAdmin = (userData) => {
    if (!userData) return false;
    const role = userData.role?.name || userData.roleName || userData.role;
    const normalizedRole = String(role).toUpperCase().replace(/[_\s-]/g, '');
    console.log('🔍 Checking role:', role, '→ Normalized:', normalizedRole);
    return normalizedRole === 'SUPERADMIN' || normalizedRole === 'ADMIN';
  };

  useEffect(() => {
    const tokenData = getToken();
    console.log('🔐 Token Data:', tokenData);
    
    if (tokenData?.user || tokenData?.data?.user) {
      const userData = tokenData.user || tokenData.data?.user;
      console.log('👤 User Data:', userData);
      setUser(userData);
      
      console.log('✅ Is Super Admin?', isSuperAdmin(userData));
      
      if (isSuperAdmin(userData)) {
        // Super admin: Always fetch tenants from API (not in login response)
        console.log('🎯 Super Admin detected - fetching tenants from API');
        fetchTenantsFromApi();
      } else {
        // Non-admin: Use tenants from login response
        const loginResponse = tokenData.data?.loginResponse || userData.loginResponse;
        const userTenants = loginResponse?.tenants || [];
        console.log('🏢 Login Response Tenants:', userTenants);
        
        const userTenant = userTenants?.[0];
        if (userTenant) {
          console.log('🏢 Setting tenant for non-admin:', userTenant.name);
          setTenants([userTenant]);
          setSelectedTenant(userTenant);
        }
      }
    }
  }, []);

  const fetchTenantsFromApi = async () => {
    try {
      console.log('🔄 Fetching tenants from API...');
      const response = await tenantsApi.list(true);
      const tenantsList = Array.isArray(response) ? response : (response?.data || response?.items || []);
      
      console.log('✅ Fetched tenants from API:', tenantsList.length);
      setTenants(tenantsList);
      
      // Auto-select first tenant
      if (tenantsList.length > 0) {
        console.log('🎯 Auto-selecting first tenant:', tenantsList[0].name);
        setSelectedTenant(tenantsList[0]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch tenants from API:', error);
      setToast({ type: 'error', message: 'Failed to load tenants' });
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, activeTab, status, fromDate, toDate, currentPage]);

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

      // Only add date filters if they are set
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
    // Navigate to article detail/edit page
    const articleType = article.type || activeTab;
    
    // For now, just log the article - you can implement detail view later
    console.log('📄 View article:', article);
    
    // Example navigation (adjust based on your routing structure):
    // router.push(`/admin/articles/${articleType}/${article.id}`);
    
    setToast({ 
      type: 'info', 
      message: `Article: ${article.title || article.heading} | Type: ${articleType}` 
    });
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {article.title || article.heading}
                        </h3>
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
                        onClick={() => handleViewArticle(article)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
    </div>
  );
}
