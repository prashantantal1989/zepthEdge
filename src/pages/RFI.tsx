import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Download, Search, Filter, Plus, MoreHorizontal, 
  Calendar, User, MessageSquare, Eye, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadRFIs, RFI as RFIType, deleteRFI } from '../utils/rfis';
import { loadDocuments } from '../utils/documents';

const RFI = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [rfis, setRFIs] = useState<RFIType[]>([]);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    const fetchRFIs = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await loadRFIs(id);
        setRFIs(data);
        
        // Load documents for each RFI
        const docs = await loadDocuments(id, 'rfi');
        
        // Group documents by RFI ID (from metadata)
        const docsByRFI: {[key: string]: any[]} = {};
        docs.forEach(doc => {
          if (doc.metadata && doc.metadata.rfiId) {
            const rfiId = doc.metadata.rfiId;
            if (!docsByRFI[rfiId]) {
              docsByRFI[rfiId] = [];
            }
            docsByRFI[rfiId].push({
              name: doc.name,
              size: formatFileSize(doc.size),
              id: doc.id
            });
          }
        });
        
        setDocuments(docsByRFI);
      } catch (error) {
        console.error('Error loading RFIs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRFIs();
  }, [id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (rfiId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this RFI?')) {
      try {
        const success = await deleteRFI(rfiId);
        if (success) {
          // Refresh RFIs list
          const data = await loadRFIs(id);
          setRFIs(data);
        }
      } catch (error) {
        console.error('Error deleting RFI:', error);
      }
    }
  };

  // Filter RFIs based on search query and status
  const filteredRFIs = rfis.filter(rfi => {
    const matchesSearch = 
      rfi.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfi.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? rfi.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search RFIs..."
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
            onClick={() => navigate(`/properties/${id}/collab/rfi/new`)}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={16} />
            <span>New RFI</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRFIs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-pastel-gray mb-4" />
              <h3 className="text-lg font-medium text-pastel-dusty mb-2">No RFIs found</h3>
              <p className="text-sm text-pastel-gray mb-6">
                {searchQuery || filterStatus 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first RFI to get started'}
              </p>
              <button
                onClick={() => navigate(`/properties/${id}/collab/rfi/new`)}
                className="px-4 py-2 bg-pastel-mauve text-white rounded-lg inline-flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
              >
                <Plus size={16} />
                <span>New RFI</span>
              </button>
            </div>
          ) : (
            filteredRFIs.map((rfi) => (
              <motion.div
                key={rfi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 hover:border-pastel-mauve transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <MessageSquare size={20} className="text-pastel-mauve" />
                        <h3 className="text-lg font-medium text-pastel-dusty">{rfi.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rfi.status === 'answered' ? 'bg-green-100 text-green-800' :
                          rfi.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          rfi.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-pastel-gray">{rfi.question}</p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-pastel-gray">Attachments</p>
                          <div className="mt-1 space-y-1">
                            {documents[rfi.id] && documents[rfi.id].map((doc, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText size={14} className="text-pastel-gray mr-2" />
                                  <span className="text-sm text-pastel-dusty">{doc.name}</span>
                                </div>
                                <span className="text-xs text-pastel-gray">{doc.size}</span>
                              </div>
                            ))}
                            {(!documents[rfi.id] || documents[rfi.id].length === 0) && (
                              <div className="text-sm text-pastel-gray">No attachments</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-pastel-gray">Status</p>
                          <div className="mt-1">
                            <div className="flex items-center text-sm text-pastel-dusty">
                              {rfi.status === 'open' && <Clock size={14} className="mr-2 text-blue-500" />}
                              {rfi.status === 'pending' && <Clock size={14} className="mr-2 text-amber-500" />}
                              {rfi.status === 'answered' && <CheckCircle2 size={14} className="mr-2 text-green-500" />}
                              {rfi.status === 'closed' && <XCircle size={14} className="mr-2 text-gray-500" />}
                              <span>
                                {rfi.status === 'open' && 'Open - Awaiting assignment'}
                                {rfi.status === 'pending' && 'Pending - Awaiting response'}
                                {rfi.status === 'answered' && 'Answered - Response provided'}
                                {rfi.status === 'closed' && 'Closed - Issue resolved'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-xs text-pastel-gray">
                        {rfi.assignedTo && (
                          <div className="flex items-center">
                            <User size={14} className="mr-1" />
                            <span>Assigned to {rfi.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>Due by {rfi.dueDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>Created on {new Date(rfi.createdAt).toLocaleDateString()}</span>
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
                        className="p-2 text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg"
                        title="Add Response"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        className="p-2 text-pastel-gray hover:text-red-500 hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg"
                        title="Delete"
                        onClick={() => handleDelete(rfi.id)}
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

export default RFI;