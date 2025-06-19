import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, X, Plus, PenTool as Tool, Calendar, DollarSign, Building2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadAssets, createAssetMaintenance } from '../utils/assets';
import { uploadDocument } from '../utils/documents';
import { getPropertyById } from '../utils/properties';

interface MaintenanceForm {
  maintenanceType: string;
  description: string;
  scheduledDate: string;
  completedDate: string;
  cost: number;
  performedBy: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  documents: File[];
}

const maintenanceTypes = [
  'Preventive',
  'Corrective',
  'Condition-based',
  'Predictive',
  'Emergency',
  'Inspection',
  'Calibration',
  'Upgrade',
  'Other'
];

const AssetMaintenanceNew = () => {
  const navigate = useNavigate();
  const { id, assetId } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  const [maintenance, setMaintenance] = useState<MaintenanceForm>({
    maintenanceType: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    completedDate: '',
    cost: 0,
    performedBy: '',
    status: 'scheduled',
    notes: '',
    documents: []
  });

  useEffect(() => {
    const fetchData = async () => {
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
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, assetId]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!maintenance.maintenanceType) errors.maintenanceType = 'Maintenance type is required';
    if (!maintenance.description.trim()) errors.description = 'Description is required';
    if (!maintenance.scheduledDate) errors.scheduledDate = 'Scheduled date is required';
    
    // If status is completed, completed date is required
    if (maintenance.status === 'completed' && !maintenance.completedDate) {
      errors.completedDate = 'Completed date is required for completed maintenance';
    }
    
    // If completed date is provided, it can't be before scheduled date
    if (maintenance.completedDate && new Date(maintenance.completedDate) < new Date(maintenance.scheduledDate)) {
      errors.completedDate = 'Completed date cannot be before scheduled date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!id || !assetId || !property || !asset) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the maintenance record
      const newMaintenance = await createAssetMaintenance({
        assetId,
        propertyId: id,
        maintenanceType: maintenance.maintenanceType,
        description: maintenance.description,
        scheduledDate: maintenance.scheduledDate,
        completedDate: maintenance.completedDate,
        cost: maintenance.cost,
        performedBy: maintenance.performedBy,
        status: maintenance.status,
        notes: maintenance.notes
      });
      
      if (!newMaintenance) {
        throw new Error('Failed to create maintenance record');
      }
      
      // Upload documents
      for (const file of maintenance.documents) {
        await uploadDocument(id, file, 'maintenance', {
          assetId,
          maintenanceId: newMaintenance.id
        });
      }

      // Navigate back to the asset detail page
      navigate(`/properties/${id}/assets/${assetId}`);
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      alert('Failed to create maintenance record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setMaintenance(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setMaintenance(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
      </div>
    );
  }

  if (!property || !asset) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/properties/${id}/assets/${assetId}`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">Schedule Maintenance</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Tag size={14} className="mr-1.5" />
                <span>{asset.name}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Tool size={18} />
            <span>{isSubmitting ? 'Creating...' : 'Create Record'}</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Maintenance Type
                </label>
                <select
                  value={maintenance.maintenanceType}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, maintenanceType: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="">Select maintenance type</option>
                  {maintenanceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.maintenanceType && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.maintenanceType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Status
                </label>
                <select
                  value={maintenance.status}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Description
              </label>
              <textarea
                value={maintenance.description}
                onChange={(e) => setMaintenance(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Describe the maintenance to be performed"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={maintenance.scheduledDate}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.scheduledDate && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.scheduledDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Completed Date
                </label>
                <input
                  type="date"
                  value={maintenance.completedDate}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, completedDate: e.target.value }))}
                  disabled={maintenance.status !== 'completed'}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {formErrors.completedDate && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.completedDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Cost
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maintenance.cost || ''}
                    onChange={(e) => setMaintenance(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray">
                    {property.currency.symbol}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Performed By
                </label>
                <input
                  type="text"
                  value={maintenance.performedBy}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, performedBy: e.target.value }))}
                  placeholder="Enter name or company"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Notes
              </label>
              <textarea
                value={maintenance.notes}
                onChange={(e) => setMaintenance(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Enter any additional notes"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-2">
                Documents
              </label>
              
              <div className="p-6 border-2 border-pastel-pink border-opacity-20 border-dashed rounded-lg text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <Upload size={24} className="mx-auto text-pastel-gray mb-2" />
                  <div className="text-sm text-pastel-gray">
                    <span className="text-pastel-mauve hover:text-pastel-dusty">Upload files</span>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-pastel-gray mt-1">PDF, DOC, XLS, JPG up to 10MB</p>
                </label>
              </div>
              
              {maintenance.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {maintenance.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-pastel-peach bg-opacity-5"
                    >
                      <div className="flex items-center">
                        <FileText size={16} className="text-pastel-gray mr-2" />
                        <span className="text-sm text-pastel-dusty">{doc.name}</span>
                        <span className="ml-2 text-xs text-pastel-gray">
                          ({Math.round(doc.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-pastel-gray hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetMaintenanceNew;