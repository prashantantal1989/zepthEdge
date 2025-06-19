import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, ArrowUpRight, Download, Tag, Calendar, DollarSign, PenTool as Tool, Truck, CheckCircle2, AlertCircle, XCircle, Clock 
} from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import { motion } from 'framer-motion';
import { loadAssets, Asset } from '../utils/assets';
import { getPropertyById } from '../utils/properties';

const AssetInventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [assetCategories, setAssetCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Load property
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
        
        // Load assets
        const filters: any = {};
        if (filterType) filters.type = filterType;
        if (filterCategory) filters.category = filterCategory;
        if (filterStatus) filters.status = filterStatus;
        if (searchQuery) filters.search = searchQuery;
        
        const assetsData = await loadAssets(id, filters);
        setAssets(assetsData);
        
        // Extract unique types and categories for filters
        const types = Array.from(new Set(assetsData.map(asset => asset.type)));
        const categories = Array.from(new Set(assetsData.map(asset => asset.category)));
        
        setAssetTypes(types);
        setAssetCategories(categories);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, filterType, filterCategory, filterStatus, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'maintenance':
        return <Tool size={16} className="text-amber-500" />;
      case 'disposed':
        return <XCircle size={16} className="text-red-500" />;
      case 'transferred':
        return <Truck size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-amber-100 text-amber-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportCSV = () => {
    if (assets.length === 0) return;
    
    // Create CSV content
    const headers = ['Name', 'Type', 'Category', 'Tag ID', 'Serial Number', 'Status', 'Condition', 'Location', 'Purchase Date', 'Purchase Cost', 'Current Value'];
    const rows = assets.map(asset => [
      asset.name,
      asset.type,
      asset.category,
      asset.tagId || '',
      asset.serialNumber || '',
      asset.status,
      asset.condition || '',
      asset.location || '',
      asset.purchaseDate || '',
      asset.purchaseCost ? asset.purchaseCost.toString() : '',
      asset.currentValue ? asset.currentValue.toString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_${property?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
        </div>
        
        <div className="flex space-x-3">
          <Tooltip content="Filter by asset type">
            <div className="relative">
              <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
                <Filter size={16} />
                <span>{filterType || 'All Types'}</span>
              </button>
              {assetTypes.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-pastel-pink border-opacity-20 py-2 z-10 hidden group-hover:block">
                  <button
                    onClick={() => setFilterType(null)}
                    className="w-full text-left px-4 py-2 hover:bg-pastel-peach hover:bg-opacity-10 text-sm"
                  >
                    All Types
                  </button>
                  {assetTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className="w-full text-left px-4 py-2 hover:bg-pastel-peach hover:bg-opacity-10 text-sm"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tooltip>
          
          <Tooltip content="Filter by category">
            <div className="relative">
              <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
                <Filter size={16} />
                <span>{filterCategory || 'All Categories'}</span>
              </button>
              {assetCategories.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-pastel-pink border-opacity-20 py-2 z-10 hidden group-hover:block">
                  <button
                    onClick={() => setFilterCategory(null)}
                    className="w-full text-left px-4 py-2 hover:bg-pastel-peach hover:bg-opacity-10 text-sm"
                  >
                    All Categories
                  </button>
                  {assetCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      className="w-full text-left px-4 py-2 hover:bg-pastel-peach hover:bg-opacity-10 text-sm"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tooltip>
          
          <Tooltip content="Export asset data to CSV">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </Tooltip>
          
          <Tooltip content="Add a new asset to inventory">
            <button 
              onClick={() => navigate(`/properties/${id}/assets/new`)}
              className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
            >
              <Plus size={16} />
              <span>Add Asset</span>
            </button>
          </Tooltip>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-pastel-pink divide-opacity-20">
              <thead className="bg-pastel-peach bg-opacity-5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Asset</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Type/Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Tag/Serial</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Purchase</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-pastel-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-pastel-pink divide-opacity-20">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-pastel-gray">
                      <div className="flex flex-col items-center">
                        <Tag size={48} className="mb-4 text-pastel-pink text-opacity-30" />
                        <p className="text-lg font-medium mb-2">No assets found</p>
                        <p className="text-sm mb-6">Add your first asset to get started</p>
                        <button 
                          onClick={() => navigate(`/properties/${id}/assets/new`)}
                          className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
                        >
                          <Plus size={16} />
                          <span>Add Asset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr 
                      key={asset.id}
                      className="hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer"
                      onClick={() => navigate(`/properties/${id}/assets/${asset.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pastel-peach bg-opacity-10 flex items-center justify-center">
                            <Tag size={20} className="text-pastel-mauve" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-pastel-dusty">{asset.name}</div>
                            <div className="text-sm text-pastel-gray">{asset.manufacturer} {asset.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-pastel-dusty">{asset.type}</div>
                        <div className="text-sm text-pastel-gray">{asset.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.tagId && (
                          <div className="text-sm text-pastel-dusty">
                            <span className="font-medium">Tag:</span> {asset.tagId}
                          </div>
                        )}
                        {asset.serialNumber && (
                          <div className="text-sm text-pastel-gray">
                            <span className="font-medium">S/N:</span> {asset.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(asset.status)}
                          <span className="ml-1.5 text-sm text-pastel-dusty capitalize">{asset.status}</span>
                        </div>
                        {asset.condition && (
                          <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-pastel-dusty">{asset.location || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.purchaseDate && (
                          <div className="flex items-center text-sm text-pastel-dusty">
                            <Calendar size={14} className="mr-1.5 text-pastel-gray" />
                            {new Date(asset.purchaseDate).toLocaleDateString()}
                          </div>
                        )}
                        {asset.purchaseCost && (
                          <div className="flex items-center text-sm text-pastel-gray mt-1">
                            <DollarSign size={14} className="mr-1.5" />
                            {property?.currency?.symbol} {asset.purchaseCost.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.currentValue ? (
                          <div className="text-sm font-medium text-pastel-dusty">
                            {property?.currency?.symbol} {asset.currentValue.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-sm text-pastel-gray">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/properties/${id}/assets/${asset.id}`);
                          }}
                          className="text-pastel-mauve hover:text-pastel-dusty"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetInventory;