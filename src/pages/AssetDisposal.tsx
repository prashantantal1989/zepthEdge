import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Clock, CheckCircle2, XCircle, LayoutDashboard,
  Plus, Search, Filter, ArrowUpRight
} from 'lucide-react';
import { loadAssetDisposals, AssetDisposal as DisposalType } from '../utils/assetDisposal';
import AssetDisposalDashboard from './AssetDisposalDashboard';

const AssetDisposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDisposalForm, setShowNewDisposalForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [disposals, setDisposals] = useState<DisposalType[]>([]);

  useEffect(() => {
    const fetchDisposals = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await loadAssetDisposals(id);
        setDisposals(data);
      } catch (error) {
        console.error('Error loading asset disposals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisposals();
  }, []);

  const filteredDisposals = disposals.filter(disposal => {
    const matchesSearch = 
      disposal.assetDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disposal.assetType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disposal.assetTagId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus ? disposal.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search disposals..."
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
              <span>{filterStatus ? `Status: ${filterStatus}` : 'All Statuses'}</span>
            </button>
          </div>
          
          <button 
            onClick={() => navigate(`/properties/${id}/disposal/new`)}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            {showDashboard ? (
              <>
                <Plus size={16} />
                <span>New Disposal</span>
              </>
            ) : (
              <>
                <LayoutDashboard size={16} />
                <span>View Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        showDashboard ? (
          <AssetDisposalDashboard propertyId={id} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {filteredDisposals.map((disposal) => (
              <motion.div
                key={disposal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 hover:border-pastel-mauve cursor-pointer transition-all duration-200"
                onClick={() => navigate(`/properties/${id}/disposal/${disposal.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-pastel-dusty">{disposal.assetDescription}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          disposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          disposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {disposal.status.charAt(0).toUpperCase() + disposal.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-pastel-gray">Asset Type</p>
                          <p className="text-sm text-pastel-dusty">{disposal.assetType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-pastel-gray">Asset Tag/ID</p>
                          <p className="text-sm text-pastel-dusty">{disposal.assetTagId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-pastel-gray">Net Book Value</p>
                          <p className="text-sm text-pastel-dusty">${Number(disposal.netBookValue).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-pastel-gray">
                        <div className="flex items-center">
                          <Building2 size={14} className="mr-1" />
                          <span>{disposal.vendor}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          <span>Submitted on {new Date(disposal.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="p-2 text-pastel-mauve hover:text-pastel-dusty"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/properties/${id}/disposal/${disposal.id}`);
                      }}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
};


export default AssetDisposal;