import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Download, Search, Filter, Plus, MoreHorizontal, 
  Calendar, User, PackageOpen, Eye, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadTransmittals, Transmittal as TransmittalType, deleteTransmittal } from '../utils/transmittals';

const Transmittal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [transmittals, setTransmittals] = useState<TransmittalType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransmittals = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await loadTransmittals(id);
        setTransmittals(data);
      } catch (error) {
        console.error('Error loading transmittals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransmittals();
  }, [id]);

  const handleDelete = async (transmittalId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this transmittal?')) {
      try {
        const success = await deleteTransmittal(transmittalId);
        if (success) {
          // Refresh transmittals list
          const data = await loadTransmittals(id);
          setTransmittals(data);
        }
      } catch (error) {
        console.error('Error deleting transmittal:', error);
      }
    }
  };

  // Filter transmittals based on search query and status
  const filteredTransmittals = transmittals.filter(transmittal => {
    const matchesSearch = transmittal.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? transmittal.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search transmittals..."
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
            onClick={() => navigate(`/properties/${id}/collab/transmittal/new`)}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={16} />
            <span>New Transmittal</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransmittals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-12 text-center">
              <PackageOpen size={48} className="mx-auto text-pastel-gray mb-4" />
              <h3 className="text-lg font-medium text-pastel-dusty mb-2">No transmittals found</h3>
              <p className="text-sm text-pastel-gray mb-6">
                {searchQuery || filterStatus 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first transmittal to get started'}
              </p>
              <button
                onClick={() => navigate(`/properties/${id}/collab/transmittal/new`)}
                className="px-4 py-2 bg-pastel-mauve text-white rounded-lg inline-flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
              >
                <Plus size={16} />
                <span>New Transmittal</span>
              </button>
            </div>
          ) : (
            filteredTransmittals.map((transmittal) => (
              <motion.div
                key={transmittal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 hover:border-pastel-mauve transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <PackageOpen size={20} className="text-pastel-mauve" />
                        <h3 className="text-lg font-medium text-pastel-dusty">{transmittal.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transmittal.status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                          transmittal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          transmittal.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transmittal.status.charAt(0).toUpperCase() + transmittal.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-pastel-gray">Recipients</p>
                          <div className="mt-1">
                            <p className="text-sm text-pastel-dusty">{transmittal.recipients.join(', ')}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-pastel-gray">Due Date</p>
                          <div className="mt-1 flex items-center">
                            <Calendar size={14} className="text-pastel-gray mr-2" />
                            <span className="text-sm text-pastel-dusty">{transmittal.dueDate}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-pastel-gray">Created</p>
                          <div className="mt-1 flex items-center">
                            <Clock size={14} className="text-pastel-gray mr-2" />
                            <span className="text-sm text-pastel-dusty">
                              {new Date(transmittal.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {transmittal.notes && (
                        <div className="mt-4 text-sm text-pastel-gray">{transmittal.notes}</div>
                      )}
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
                        onClick={() => handleDelete(transmittal.id)}
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

export default Transmittal;