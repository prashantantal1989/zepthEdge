import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Calendar, DollarSign, PenTool as Tool, Truck, CheckCircle2, AlertCircle, XCircle, Edit2, Trash2, Clock, User, FileText, Download, Eye, Plus } from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import { motion } from 'framer-motion';
import { loadAssets, Asset, loadAssetMaintenance, AssetMaintenance } from '../utils/assets';
import { getPropertyById } from '../utils/properties';
import { loadDocuments } from '../utils/documents';

const AssetDetail = () => {
  const { id, assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AssetMaintenance[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'documents'>('details');

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!id || !assetId) return;
      
      setLoading(true);
      try {
        // Load property
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
        
        // Load asset
        const assets = await loadAssets(id);
        const selectedAsset = assets.find(a => a.id === assetId);
        if (selectedAsset) {
          setAsset(selectedAsset);
          
          // Load maintenance records
          const maintenance = await loadAssetMaintenance(assetId);
          setMaintenanceRecords(maintenance);
          
          // Load documents
          const docs = await loadDocuments(id, 'asset');
          const assetDocs = docs.filter(doc => 
            doc.metadata && doc.metadata.assetId === assetId
          );
          
          setDocuments(assetDocs.map(doc => ({
            id: doc.id,
            name: doc.name,
            size: formatFileSize(doc.size),
            type: doc.mimeType,
            date: new Date(doc.createdAt).toLocaleDateString(),
            // Assuming doc.path from loadDocuments (now API-driven) will be the direct public URL
            // or a new field like doc.publicUrl will be provided by the API.
            // TODO: Adjust if the API returns a path that needs further processing
            // via a new utility function e.g. getPublicUrl(doc.path) which calls a backend helper.
            url: doc.path // Or doc.publicUrl if the API provides that
          })));
        }
      } catch (error) {
        console.error('Error loading asset details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [id, assetId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'maintenance':
        return <Tool size={20} className="text-amber-500" />;
      case 'disposed':
        return <XCircle size={20} className="text-red-500" />;
      case 'transferred':
        return <Truck size={20} className="text-blue-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
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

  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
      </div>
    );
  }

  if (!asset || !property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-pastel-dusty">Asset Not Found</h2>
        <p className="text-pastel-gray mt-2">The asset you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(`/properties/${id}/assets`)}
          className="mt-4 px-4 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty"
        >
          Back to Assets
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/properties/${id}/assets`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">{asset.name}</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Tag size={14} className="mr-1.5" />
                <span>{asset.manufacturer} {asset.model} • {asset.type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`px-6 py-4 rounded-lg mb-6 ${
          asset.status === 'active' ? 'bg-green-50' :
          asset.status === 'maintenance' ? 'bg-amber-50' :
          asset.status === 'disposed' ? 'bg-red-50' :
          'bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(asset.status)}
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  asset.status === 'active' ? 'text-green-800' :
                  asset.status === 'maintenance' ? 'text-amber-800' :
                  asset.status === 'disposed' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                </h3>
                {asset.condition && (
                  <p className={`text-xs ${
                    asset.status === 'active' ? 'text-green-600' :
                    asset.status === 'maintenance' ? 'text-amber-600' :
                    asset.status === 'disposed' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    Condition: {asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Tooltip content="Edit asset details">
                <button
                  onClick={() => navigate(`/properties/${id}/assets/${assetId}/edit`)}
                  className="px-3 py-1.5 text-sm border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
              </Tooltip>
              <Tooltip content="Schedule maintenance for this asset">
                <button
                  onClick={() => navigate(`/properties/${id}/assets/${assetId}/maintenance/new`)}
                  className="px-3 py-1.5 text-sm border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve"
                >
                  <Tool size={14} />
                  <span>Schedule Maintenance</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-pastel-pink border-opacity-20">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'details'
                  ? 'border-pastel-mauve text-pastel-mauve'
                  : 'border-transparent text-pastel-gray hover:text-pastel-dusty hover:border-pastel-pink'
              }`}
            >
              Asset Details
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'maintenance'
                  ? 'border-pastel-mauve text-pastel-mauve'
                  : 'border-transparent text-pastel-gray hover:text-pastel-dusty hover:border-pastel-pink'
              }`}
            >
              Maintenance History
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'documents'
                  ? 'border-pastel-mauve text-pastel-mauve'
                  : 'border-transparent text-pastel-gray hover:text-pastel-dusty hover:border-pastel-pink'
              }`}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="text-lg font-medium text-pastel-dusty mb-4">Asset Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pastel-gray">Asset Type</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pastel-gray">Category</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.category}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pastel-gray">Tag ID</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.tagId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pastel-gray">Serial Number</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.serialNumber || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-pastel-gray">Location</p>
                    <p className="text-sm font-medium text-pastel-dusty">{asset.location || '-'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pastel-gray">Manufacturer</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.manufacturer || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pastel-gray">Model</p>
                      <p className="text-sm font-medium text-pastel-dusty">{asset.model || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-pastel-gray">Supplier</p>
                    <p className="text-sm font-medium text-pastel-dusty">{asset.supplier || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-pastel-dusty mb-4">Financial Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pastel-gray">Purchase Date</p>
                      <p className="text-sm font-medium text-pastel-dusty">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-pastel-gray">Warranty Expiry</p>
                      <p className="text-sm font-medium text-pastel-dusty">
                        {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pastel-gray">Purchase Cost</p>
                      <p className="text-sm font-medium text-pastel-dusty">
                        {asset.purchaseCost 
                          ? `${property.currency.symbol} ${asset.purchaseCost.toLocaleString()}`
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-pastel-gray">Current Value</p>
                      <p className="text-sm font-medium text-pastel-dusty">
                        {asset.currentValue 
                          ? `${property.currency.symbol} ${asset.currentValue.toLocaleString()}`
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-pastel-gray">Depreciation</p>
                    {asset.purchaseCost && asset.currentValue ? (
                      <div>
                        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pastel-mauve rounded-full"
                            style={{ 
                              width: `${Math.max(0, 100 - ((asset.currentValue / asset.purchaseCost) * 100))}%` 
                            }}
                          ></div>
                        </div>
                        <p className="mt-1 text-xs text-pastel-gray">
                          {Math.round(100 - ((asset.currentValue / asset.purchaseCost) * 100))}% depreciated
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-pastel-dusty">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {asset.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-pastel-dusty mb-2">Notes</h3>
                <p className="text-sm text-pastel-gray">{asset.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="p-6 border-b border-pastel-pink border-opacity-20 flex justify-between items-center">
              <h3 className="text-lg font-medium text-pastel-dusty">Maintenance History</h3>
              <button
                onClick={() => navigate(`/properties/${id}/assets/${assetId}/maintenance/new`)}
                className="px-3 py-1.5 text-sm bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
              >
                <Plus size={14} />
                <span>Add Record</span>
              </button>
            </div>
            
            {maintenanceRecords.length === 0 ? (
              <div className="p-12 text-center">
                <Tool size={48} className="mx-auto text-pastel-gray mb-4" />
                <h3 className="text-lg font-medium text-pastel-dusty mb-2">No maintenance records</h3>
                <p className="text-sm text-pastel-gray mb-6">
                  Keep track of all maintenance activities for this asset
                </p>
                <button
                  onClick={() => navigate(`/properties/${id}/assets/${assetId}/maintenance/new`)}
                  className="px-4 py-2 bg-pastel-mauve text-white rounded-lg inline-flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
                >
                  <Plus size={16} />
                  <span>Schedule Maintenance</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-pastel-pink divide-opacity-20">
                  <thead className="bg-pastel-peach bg-opacity-5">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Scheduled</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Completed</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Cost</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRecords.map((record) => (
                      <tr 
                        key={record.id}
                        className="hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer"
                        onClick={() => navigate(`/properties/${id}/assets/${assetId}/maintenance/${record.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-pastel-dusty">{record.maintenanceType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-pastel-gray">{record.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-pastel-dusty">
                            {new Date(record.scheduledDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-pastel-dusty">
                            {record.completedDate 
                              ? new Date(record.completedDate).toLocaleDateString()
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getMaintenanceStatusColor(record.status)
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-pastel-dusty">
                            {record.cost 
                              ? `${property.currency.symbol} ${record.cost.toLocaleString()}`
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-pastel-dusty">{record.performedBy || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="p-6 border-b border-pastel-pink border-opacity-20 flex justify-between items-center">
              <h3 className="text-lg font-medium text-pastel-dusty">Documents</h3>
              <button
                onClick={() => navigate(`/properties/${id}/assets/${assetId}/documents/upload`)}
                className="px-3 py-1.5 text-sm bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
              >
                <Plus size={14} />
                <span>Upload Document</span>
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-pastel-gray mb-4" />
                <h3 className="text-lg font-medium text-pastel-dusty mb-2">No documents</h3>
                <p className="text-sm text-pastel-gray mb-6">
                  Upload documents related to this asset
                </p>
                <button
                  onClick={() => navigate(`/properties/${id}/assets/${assetId}/documents/upload`)}
                  className="px-4 py-2 bg-pastel-mauve text-white rounded-lg inline-flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
                >
                  <Plus size={16} />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-4 border border-pastel-pink border-opacity-20 rounded-lg hover:border-pastel-mauve transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <FileText size={20} className="text-pastel-mauve mt-1" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-pastel-dusty">{doc.name}</p>
                          <p className="text-xs text-pastel-gray mt-1">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tooltip content="View document">
                          <button 
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1.5 text-pastel-gray hover:text-pastel-mauve rounded-lg hover:bg-pastel-peach hover:bg-opacity-10"
                          >
                            <Eye size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Download document">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.url;
                              link.download = doc.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-1.5 text-pastel-gray hover:text-pastel-mauve rounded-lg hover:bg-pastel-peach hover:bg-opacity-10"
                          >
                            <Download size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetail;