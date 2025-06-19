import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, FileText, Play, MessageSquare, Newspaper,
  ChevronRight, Book, LifeBuoy, AlertCircle, HelpCircle
} from 'lucide-react';
import { 
  loadQuickActions, 
  loadFeaturedArticles, 
  loadHelpCategories, 
  loadRecentUpdates,
  searchArticles,
  QuickAction,
  Article,
  HelpCategory,
  Update
} from '../utils/helpCenter';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [helpCategories, setHelpCategories] = useState<HelpCategory[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelpCenterData = async () => {
      setLoading(true);
      try {
        const [actions, articles, categories, updates] = await Promise.all([
          loadQuickActions(),
          loadFeaturedArticles(),
          loadHelpCategories(),
          loadRecentUpdates()
        ]);

        setQuickActions(actions);
        setFeaturedArticles(articles);
        setHelpCategories(categories);
        setRecentUpdates(updates);
      } catch (error) {
        console.error('Error loading help center data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpCenterData();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchArticles(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching articles:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Get the appropriate icon component based on the icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return MessageSquare;
      case 'Play': return Play;
      case 'HelpCircle': return HelpCircle;
      case 'Book': return Book;
      case 'FileText': return FileText;
      case 'LifeBuoy': return LifeBuoy;
      case 'AlertCircle': return AlertCircle;
      default: return HelpCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pastel-peach to-pastel-mauve py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            How can we help you today?
          </h1>
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search help articles, tutorials, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:border-white/40 backdrop-blur-sm ${isSearching ? 'animate-pulse' : ''}`}
            />
            <Search size={24} className="absolute left-4 top-4 text-white/70" />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-pastel-pink border-opacity-20 z-10">
                <div className="p-2">
                  <h3 className="text-sm font-medium text-pastel-gray px-3 py-2">Search Results</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map(article => (
                      <button
                        key={article.id}
                        className="w-full text-left px-3 py-2 hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg"
                        onClick={() => window.location.href = `/help/articles/${article.id}`}
                      >
                        <div className="text-sm font-medium text-pastel-dusty">{article.title}</div>
                        <div className="text-xs text-pastel-gray mt-1">
                          {article.category} • {article.readTime}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            Array(4).fill(0).map((_, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-200 mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))
          ) : quickActions.map((action) => {
            const IconComponent = getIconComponent(action.icon);
            return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left"
              onClick={() => { if (action.url) window.location.href = action.url; }}
            >
              <div className={`${action.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <IconComponent size={24} className={action.iconColor} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </motion.button>
          )})}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Articles */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading ? (
                  Array(4).fill(0).map((_, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg border border-gray-100 animate-pulse"
                    >
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))
                ) : featuredArticles.map((article) => (
                  <motion.button
                    key={article.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg border border-gray-100 hover:border-pastel-mauve text-left transition-colors"
                    onClick={() => window.location.href = `/help/articles/${article.id}`}
                  >
                    <span className="text-xs font-medium text-pastel-mauve px-2 py-1 rounded-full bg-pastel-peach bg-opacity-10">
                      {article.category}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900 mt-3 mb-2">{article.title}</h3>
                    <p className="text-xs text-gray-500">{article.readTime}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Help Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
              <div className="space-y-6">
                {loading ? (
                  Array(2).fill(0).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="space-y-2">
                        {Array(3).fill(0).map((_, i) => (
                          <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : helpCategories.map((category) => {
                  const CategoryIcon = getIconComponent(category.icon);
                  return (
                  <div key={category.title}>
                    <div className="flex items-center gap-2 mb-4">
                      <CategoryIcon size={20} className="text-pastel-mauve" />
                      <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {category.articles.map((article) => (
                        <button
                          key={article.id}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-pastel-peach hover:bg-opacity-5 transition-colors text-left group"
                          onClick={() => window.location.href = `/help/articles/${article.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-gray-400 group-hover:text-pastel-mauve transition-colors" />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                              {article.title}
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-pastel-mauve transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support Card */}
            <div className="bg-gradient-to-br from-pastel-peach to-pastel-mauve rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <LifeBuoy size={24} />
                <h2 className="text-xl font-semibold">Need More Help?</h2>
              </div>
              <p className="text-white/90 mb-6">
                Our support team is available 24/7 to assist you with any questions or issues you may have.
              </p>
              <button className="w-full px-4 py-3 bg-white text-pastel-mauve rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 font-medium">
                <MessageSquare size={18} />
                <span>Contact Support</span>
              </button>
            </div>

            {/* Recent Updates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Updates</h2>
              <div className="space-y-4">
                {loading ? (
                  Array(2).fill(0).map((_, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                      <div className="h-5 w-5 bg-gray-200 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))
                ) : recentUpdates.map(update => (
                  <div 
                    key={update.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      update.type === 'feature' ? 'bg-green-50' :
                      update.type === 'maintenance' ? 'bg-blue-50' :
                      'bg-amber-50'
                    }`}
                  >
                    {update.type === 'feature' && (
                      <Newspaper size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.type === 'maintenance' && (
                      <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.type === 'announcement' && (
                      <HelpCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{update.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{update.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{update.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;