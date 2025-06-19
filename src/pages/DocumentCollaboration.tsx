import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Download, Search, Filter, Plus, MoreHorizontal, 
  Calendar, User, PackageOpen, ClipboardList, ArrowUpRight, KanbanSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentCollaboration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const modules = [
    {
      title: 'Document Workspace',
      description: 'Centralized repository for all non-financial files',
      icon: FileText,
      path: 'workspace',
      stats: {
        total: '156',
        label: 'Files'
      }
    },
    {
      title: 'Transmittals',
      description: 'Send and track document transmissions',
      icon: PackageOpen,
      path: 'transmittal',
      stats: {
        total: '24',
        label: 'Active'
      }
    },
    {
      title: 'Submittals',
      description: 'Non-financial approval workflow',
      icon: ClipboardList,
      path: 'submittals',
      stats: {
        total: '12',
        label: 'Pending'
      }
    },
    {
      title: 'RFI',
      description: 'Request for Information management',
      icon: FileText,
      path: 'rfi',
      stats: {
        total: '8',
        label: 'Open'
      }
    },
    {
      title: 'Task Board',
      description: 'Kanban-style task management',
      icon: KanbanSquare,
      path: 'tasks',
      stats: {
        total: '32',
        label: 'Tasks'
      }
    }
  ];

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <motion.div
            key={module.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-gradient-to-br from-white to-pastel-peach to-5% rounded-lg shadow-sm border border-pastel-pink border-opacity-20 hover:border-pastel-mauve hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/properties/${id}/collab/${module.path}`)}
          >
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pastel-pink to-pastel-mauve opacity-5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500"></div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pastel-peach bg-opacity-10 rounded-lg group-hover:bg-opacity-20 transition-colors duration-300">
                      <module.icon size={24} className="text-pastel-mauve" />
                    </div>
                    <h3 className="text-xl font-semibold text-pastel-dusty group-hover:text-pastel-mauve transition-colors duration-300">{module.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-pastel-gray leading-relaxed">{module.description}</p>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-pastel-mauve to-pastel-dusty bg-clip-text text-transparent">{module.stats.total}</span>
                    <span className="text-sm font-medium text-pastel-gray">{module.stats.label}</span>
                  </div>
                </div>
                <button 
                  className="p-2 text-pastel-mauve hover:text-pastel-dusty"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/properties/${id}/collab/${module.path}`);
                  }}
                >
                  <div className="p-2 rounded-full bg-pastel-peach bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300">
                    <ArrowUpRight size={20} />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DocumentCollaboration;