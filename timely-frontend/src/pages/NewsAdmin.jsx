import React, { useState, useEffect } from 'react';
import { getNews, createNews, updateNews, deleteNews, getBanners, createBanner, updateBanner, deleteBanner } from '../lib/api';

const NewsAdmin = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [news, setNews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [newsForm, setNewsForm] = useState({
    title: '',
    body: '',
    published: false,
    publish_at: '',
    seo_title: '',
    seo_description: ''
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    image: null,
    link_url: '',
    active: true,
    starts_at: '',
    ends_at: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [newsResponse, bannersResponse] = await Promise.all([
        getNews(),
        getBanners()
      ]);
      setNews(newsResponse.data.results || newsResponse.data);
      setBanners(bannersResponse.data.results || bannersResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = { ...newsForm };
      if (formData.publish_at) {
        formData.publish_at = new Date(formData.publish_at).toISOString();
      }

      if (editingItem) {
        await updateNews(editingItem.id, formData);
      } else {
        await createNews(formData);
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetNewsForm();
      fetchData();
    } catch (err) {
      console.error('Error saving news:', err);
      setError('Failed to save news article');
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(bannerForm).forEach(key => {
        if (bannerForm[key] !== null && bannerForm[key] !== '') {
          formData.append(key, bannerForm[key]);
        }
      });

      if (editingItem) {
        await updateBanner(editingItem.id, formData);
      } else {
        await createBanner(formData);
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetBannerForm();
      fetchData();
    } catch (err) {
      console.error('Error saving banner:', err);
      setError('Failed to save banner');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      if (type === 'news') {
        await deleteNews(id);
      } else {
        await deleteBanner(id);
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'news') {
      if (item) {
        setNewsForm({
          title: item.title || '',
          body: item.body || '',
          published: item.published || false,
          publish_at: item.publish_at ? item.publish_at.split('T')[0] : '',
          seo_title: item.seo_title || '',
          seo_description: item.seo_description || ''
        });
      } else {
        resetNewsForm();
      }
    } else {
      if (item) {
        setBannerForm({
          title: item.title || '',
          image: null,
          link_url: item.link_url || '',
          active: item.active || true,
          starts_at: item.starts_at ? item.starts_at.split('T')[0] : '',
          ends_at: item.ends_at ? item.ends_at.split('T')[0] : ''
        });
      } else {
        resetBannerForm();
      }
    }
    setShowModal(true);
  };

  const resetNewsForm = () => {
    setNewsForm({
      title: '',
      body: '',
      published: false,
      publish_at: '',
      seo_title: '',
      seo_description: ''
    });
  };

  const resetBannerForm = () => {
    setBannerForm({
      title: '',
      image: null,
      link_url: '',
      active: true,
      starts_at: '',
      ends_at: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (item, type) => {
    if (type === 'news') {
      if (item.published) {
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>;
      }
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>;
    } else {
      if (item.active) {
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      }
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
          <p className="text-gray-600">Manage news articles and promotional banners</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('news')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'news'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                News Articles ({news.length})
              </button>
              <button
                onClick={() => setActiveTab('banners')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'banners'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Banners ({banners.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* News Tab */}
            {activeTab === 'news' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">News Articles</h2>
                  <button
                    onClick={() => openModal('news')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add News Article
                  </button>
                </div>

                <div className="space-y-4">
                  {news.map((article) => (
                    <div key={article.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {article.body.substring(0, 150)}...
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Created: {formatDate(article.created_at)}</span>
                            {article.author_name && <span>By: {article.author_name}</span>}
                            {getStatusBadge(article, 'news')}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openModal('news', article)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(article.id, 'news')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banners Tab */}
            {activeTab === 'banners' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Promotional Banners</h2>
                  <button
                    onClick={() => openModal('banners')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Banner
                  </button>
                </div>

                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{banner.title}</h3>
                          {banner.image && (
                            <img 
                              src={banner.image} 
                              alt={banner.title}
                              className="w-32 h-20 object-cover rounded mb-3"
                            />
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Created: {formatDate(banner.created_at)}</span>
                            {banner.link_url && <span>Link: {banner.link_url}</span>}
                            {getStatusBadge(banner, 'banners')}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openModal('banners', banner)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id, 'banners')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit' : 'Add'} {modalType === 'news' ? 'News Article' : 'Banner'}
                </h3>
                
                <form onSubmit={modalType === 'news' ? handleNewsSubmit : handleBannerSubmit}>
                  {modalType === 'news' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={newsForm.title}
                          onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                        <textarea
                          value={newsForm.body}
                          onChange={(e) => setNewsForm({...newsForm, body: e.target.value})}
                          required
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                          <input
                            type="datetime-local"
                            value={newsForm.publish_at}
                            onChange={(e) => setNewsForm({...newsForm, publish_at: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newsForm.published}
                            onChange={(e) => setNewsForm({...newsForm, published: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">Published</label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                        <input
                          type="text"
                          value={newsForm.seo_title}
                          onChange={(e) => setNewsForm({...newsForm, seo_title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                        <textarea
                          value={newsForm.seo_description}
                          onChange={(e) => setNewsForm({...newsForm, seo_description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBannerForm({...bannerForm, image: e.target.files[0]})}
                          required={!editingItem}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                        <input
                          type="url"
                          value={bannerForm.link_url}
                          onChange={(e) => setBannerForm({...bannerForm, link_url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="datetime-local"
                            value={bannerForm.starts_at}
                            onChange={(e) => setBannerForm({...bannerForm, starts_at: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="datetime-local"
                            value={bannerForm.ends_at}
                            onChange={(e) => setBannerForm({...bannerForm, ends_at: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bannerForm.active}
                          onChange={(e) => setBannerForm({...bannerForm, active: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Active</label>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsAdmin;
