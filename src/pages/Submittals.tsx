import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Download, Search, Filter, Plus, MoreHorizontal, 
  Calendar, User, ClipboardList, Eye, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadSubmittals, Submittal as SubmittalType, deleteSubmittal } from '../utils/submittals';
import { loadDocuments } from '../utils/documents';

const Submittals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [submittals, setSubmittals] = useState<SubmittalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    const fetchSubmittals = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await loadSubmittals(id);
        setSubmittals(data);
        
        // Load documents for each submittal
        const docs = await loadDocuments(id, 'submittal');
        
        // Group documents by submittal ID (from metadata)
        const docsBySubmittal: {[key: string]: any[]} = {};
        docs.forEach(doc => {
          if (doc.metadata && doc.metadata.submittalId) {
            const submittalId = doc.metadata.submittalId;
            if (!docsBySubmittal[submittalId]) {
              docsBySubmittal[submittalId] = [];
            }
            docsBySubmittal[submittalId].push({
              name: doc.name,
              size: formatFileSize(doc.size),
              id: doc.id
            });
          }
        });
        
        setDocuments(docsBySubmittal);
      } catch (error) {
        console.error('Error loading submittals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmittals();
  }, [id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (submittalId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this submittal?')) {
      try {
        const success = await deleteSubmittal(submittalId);
        if (success) {
          // Refresh submittals list
          const data = await loadSubmittals(id);
          setSubmittals(data);
        }
      } catch (error) {
        console.error('Error deleting submittal:', error);
      }
    }
  };

  // Filter submittals based on search query and status
  const filteredSubmittals = submittals.filter(submittal => {
    const matchesSearch = 
      submittal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (submittal.description && submittal.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus ? submittal.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search submittals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
        </div>
        
        <div className="flex space-x-3">
          <div className="relative">
            <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
              <Filter size={16} />
              <span>{filterStatus || 'All Status'}</span>
            </button>
          </div>
          
          <button 
            onClick={() => navigate(`/properties/${id}/collab/submittals/new`)}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={16} />
            <span>New Submittal</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmittals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-12 text-center">
              <ClipboardList size={48} className="mx-auto text-pastel-gray mb-4" />
              <h3 className="text-lg font-medium text-pastel-dusty mb-2">No submittals found</h3>
              <p className="text-sm text-pastel-gray mb-6">
                {searchQuery || filterStatus 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first submittal to get started'}
              </p>
              <button
                onClick={() => navigate(`/properties/${id}/collab/submittals/new`)}
                className="px-4 py-2 bg-pastel-mauve text-white rounded-lg inline-flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
              >
                <Plus size={16} />
                <span>New Submittal</span>
              </button>
            </div>
          ) : (
            filteredSubmittals.map((submittal) => (
              <motion.div
                key={submittal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 hover:border-pastel-mauve transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <ClipboardList size={20} className="text-pastel-mauve" />
                        <h3 className="text-lg font-medium text-pastel-dusty">{submittal.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submittal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submittal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          submittal.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submittal.status.charAt(0).toUpperCase() + submittal.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="text-sm text-pastel-gray">{submittal.description}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-pastel-gray">Documents</p>
                          <div className="mt-1 space-y-1">
                            {documents[submittal.id] && documents[submittal.id].map((doc, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText size={14} className="text-pastel-gray mr-2" />
                                  <span className="text-sm text-pastel-dusty">{doc.name}</span>
                                </div>
                                <span className="text-xs text-pastel-gray">{doc.size}</span>
                              </div>
                            ))}
                            {(!documents[submittal.id] || documents[submittal.id].length === 0) && (
                              <div className="text-sm text-pastel-gray">No documents attached</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-pastel-gray">Status Details</p>
                          <div className="mt-1">
                            {submittal.status === 'pending' && (
                              <div className="flex items-center text-sm text-pastel-dusty">
                                <Clock size={14} className="mr-2" />
                                <span>Pending approval (Step {submittal.currentStep + 1})</span>
                              </div>
                            )}
                            {submittal.status === 'approved' && (
                              <div className="flex items-center text-sm text-pastel-dusty">
                                <CheckCircle2 size={14} className="mr-2 text-green-500" />
                                <span>Approved</span>
                              </div>
                            )}
                            {submittal.status === 'rejected' && (
                              <div>
                                <div className="flex items-center text-sm text-pastel-dusty">
                                  <XCircle size={14} className="mr-2 text-red-500" />
                                  <span>Rejected</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-xs text-pastel-gray">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>Created on {new Date(submittal.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <button 
                        className="p-2 text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="p-2 text-pastel-gray hover:text-red-500 hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg"
                        title="Delete"
                        onClick={() => handleDelete(submittal.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Submittals;