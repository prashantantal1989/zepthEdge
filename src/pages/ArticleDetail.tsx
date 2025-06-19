import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Eye, Clock, Tag, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getArticleById, loadHelpCategories, Article, HelpCategory } from '../utils/helpCenter';

const ArticleDetail = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      
      setLoading(true);
      try {
        const articleData = await getArticleById(articleId);
        setArticle(articleData);
        
        // Load related articles from the same category
        const categories = await loadHelpCategories();
        const category = categories.find(cat => 
          cat.articles.some(a => a.id === articleId)
        );
        
        if (category) {
          const related = category.articles
            .filter(a => a.id !== articleId)
            .slice(0, 3);
          setRelatedArticles(related);
        }
      } catch (error) {
        console.error('Error loading article:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been moved.</p>
          <button
            onClick={() => navigate('/help')}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty"
          >
            Back to Help Center
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-8"
            >
              <div className="mb-6">
                <button
                  onClick={() => navigate('/help')}
                  className="flex items-center text-pastel-mauve hover:text-pastel-dusty mb-4"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  <span>Back to Help Center</span>
                </button>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
                
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                  <div className="flex items-center">
                    <Tag size={14} className="mr-1.5" />
                    <span>{article.category}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1.5" />
                    <span>{article.readTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye size={14} className="mr-1.5" />
                    <span>{article.views} views</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1.5" />
                    <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none">
                {article.content ? (
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                ) : (
                  <p className="text-gray-600">
                    This is a placeholder for the article content. In a production environment, 
                    this would contain the full formatted content of the help article.
                  </p>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Was this article helpful?</h3>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                    Yes, it helped
                  </button>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">
                    No, I need more help
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Articles</h2>
                <div className="space-y-4">
                  {relatedArticles.map(related => (
                    <button
                      key={related.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-pastel-peach hover:bg-opacity-5 transition-colors text-left"
                      onClick={() => navigate(`/help/articles/${related.id}`)}
                    >
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{related.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{related.readTime}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-pastel-peach to-pastel-mauve rounded-xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <User size={24} />
                <h2 className="text-xl font-semibold">Need More Help?</h2>
              </div>
              <p className="text-white/90 mb-6">
                Our support team is available 24/7 to assist you with any questions or issues.
              </p>
              <button 
                className="w-full px-4 py-3 bg-white text-pastel-mauve rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
                onClick={() => navigate('/help/submit-ticket')}
              >
                <MessageSquare size={18} />
                <span>Contact Support</span>
              </button>
            </motion.div>
            
            {/* Table of Contents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 sticky top-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">In This Article</h3>
              <nav className="space-y-2">
                <a href="#introduction" className="block text-sm text-pastel-mauve hover:text-pastel-dusty">
                  Introduction
                </a>
                <a href="#getting-started" className="block text-sm text-gray-600 hover:text-pastel-mauve">
                  Getting Started
                </a>
                <a href="#features" className="block text-sm text-gray-600 hover:text-pastel-mauve">
                  Key Features
                </a>
                <a href="#troubleshooting" className="block text-sm text-gray-600 hover:text-pastel-mauve">
                  Troubleshooting
                </a>
                <a href="#faq" className="block text-sm text-gray-600 hover:text-pastel-mauve">
                  Frequently Asked Questions
                </a>
              </nav>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;