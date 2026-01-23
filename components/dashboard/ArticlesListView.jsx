import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getToken } from '../../utils/auth';
import { articleService } from '../../lib/api/services/articleService';
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

  useEffect(() => {
    const tokenData = getToken();
    if (tokenData?.user || tokenData?.data?.user) {
      const userData = tokenData.user || tokenData.data?.user;
      setUser(userData);
      
      const loginResponse = tokenData.data?.loginResponse || userData.loginResponse;
      const userTenants = loginResponse?.tenants || [];
      const userRole = userData.role?.name || userData.roleName || userData.role;
      
      console.log('👤 User Role:', userRole);
      console.log('🏢 User Tenants:', userTenants);
      
      if (userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN') {
        setTenants(userTenants || []);
        // Auto-select first tenant for super admin
        if (userTenants && userTenants.length > 0) {
          setSelectedTenant(userTenants[0]);
        }
      } else if (userRole === 'TENANT_ADMIN' || userRole === 'TENANTADMIN' || userRole === 'REPORTER') {
        const userTenant = userTenants?.[0];
        if (userTenant) {
          setTenants([userTenant]);
          setSelectedTenant(userTenant);
        }
      }
    }
  }, []);

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

      if (response.success && response.data) {
        setArticles(prev => ({
          ...prev,
          [activeTab]: response.data
        }));
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
          {(user?.role === 'SUPER_ADMIN' || user?.role?.name === 'SUPER_ADMIN' || user?.roleName === 'SUPER_ADMIN') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant
              </label>
              <select
                value={selectedTenant?.id || ''}
                onChange={(e) => {
                  const tenant = tenants.find(t => t.id === e.target.value);
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
