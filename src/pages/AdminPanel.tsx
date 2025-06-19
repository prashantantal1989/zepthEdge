import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, Plus, Edit2, Trash2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Settings as SettingsType, Category, WorkflowTemplate } from '../types/settings';
import { loadSettings, saveSettings } from '../utils/settings';
import CategoryFormModal from '../components/admin/CategoryFormModal';
import UserManagement from '../components/admin/UserManagement';
import WorkflowManagement from '../components/admin/WorkflowManagement';

const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(loadSettings());
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<'budget' | 'disposal'>('budget');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSaveCategory = (type: 'budget' | 'disposal', category: Category) => {
    const newSettings = { ...settings };
    if (editingCategory) {
      if (type === 'budget') {
        newSettings.budgetCategories = newSettings.budgetCategories.map(c => 
          c.id === editingCategory.id ? category : c
        );
      } else {
        newSettings.disposalCategories = newSettings.disposalCategories.map(c => 
          c.id === editingCategory.id ? category : c
        );
      }
    } else {
      const newCategory = { ...category, id: crypto.randomUUID() };
      if (type === 'budget') {
        newSettings.budgetCategories.push(newCategory);
      } else {
        newSettings.disposalCategories.push(newCategory);
      }
    }
    setSettings(newSettings);
    saveSettings(newSettings);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (type: 'budget' | 'disposal', id: string) => {
    const newSettings = { ...settings };
    if (type === 'budget') {
      newSettings.budgetCategories = newSettings.budgetCategories.filter(c => c.id !== id);
    } else {
      newSettings.disposalCategories = newSettings.disposalCategories.filter(c => c.id !== id);
    }
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users & Access
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customization Settings
          </button>
        </div>

        {activeTab === 'users' ? (
          <UserManagement />
        ) : (
          <>
            {/* Budget Categories */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Budget Categories</h3>
                  <button
                    onClick={() => {
                      setCategoryType('budget');
                      setEditingCategory(null);
                      setShowCategoryModal(true);
                    }}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-primary-700"
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {settings.budgetCategories.map((category) => (
                  <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">Code: {category.code}</p>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setCategoryType('budget');
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory('budget', category.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Disposal Categories */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Disposal Categories</h3>
                  <button
                    onClick={() => {
                      setCategoryType('disposal');
                      setEditingCategory(null);
                      setShowCategoryModal(true);
                    }}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-primary-700"
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {settings.disposalCategories.map((category) => (
                  <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">Code: {category.code}</p>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setCategoryType('disposal');
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory('disposal', category.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Workflow Templates */}
            <motion.div variants={itemVariants}>
              <WorkflowManagement />
            </motion.div>
          </>
        )}
      </motion.div>
      
      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSave={(category) => {
          handleSaveCategory(categoryType, category);
          setShowCategoryModal(false);
        }}
        category={editingCategory}
        type={categoryType}
      />
    </div>
  );
};

export default AdminPanel;