import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, X, Plus, Tag,
  Calendar, DollarSign, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createAsset } from '../utils/assets';
import { uploadDocument } from '../utils/documents';
import { getPropertyById } from '../utils/properties';

interface AssetForm {
  name: string;
  type: string;
  category: string;
  tagId: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  location: string;
  status: 'active' | 'maintenance' | 'disposed' | 'transferred';
  condition: 'new' | 'good' | 'fair' | 'poor';
  warrantyExpiry: string;
  manufacturer: string;
  model: string;
  supplier: string;
  notes: string;
  documents: File[];
}

const assetTypes = [
  'Furniture',
  'Equipment',
  'Electronics',
  'Appliance',
  'Vehicle',
  'IT Hardware',
  'Software',
  'Fixture',
  'Tool',
  'Other'
];

const assetCategories = {
  'Furniture': ['Bed', 'Chair', 'Desk', 'Table', 'Sofa', 'Cabinet', 'Other'],
  'Equipment': ['Kitchen', 'Cleaning', 'Maintenance', 'Gym', 'Other'],
  'Electronics': ['TV', 'Audio', 'Computer', 'Phone', 'Other'],
  'Appliance': ['Refrigerator', 'Microwave', 'Dishwasher', 'Washer/Dryer', 'Other'],
  'Vehicle': ['Car', 'Van', 'Truck', 'Golf Cart', 'Other'],
  'IT Hardware': ['Server', 'Network', 'Computer', 'Printer', 'Other'],
  'Software': ['Operating System', 'Application', 'License', 'Other'],
  'Fixture': ['Lighting', 'Plumbing', 'HVAC', 'Other'],
  'Tool': ['Hand Tool', 'Power Tool', 'Measuring', 'Other'],
  'Other': ['Miscellaneous']
};

const AssetNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [asset, setAsset] = useState<AssetForm>({
    name: '',
    type: '',
    category: '',
    tagId: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: 0,
    currentValue: 0,
    location: '',
    status: 'active',
    condition: 'new',
    warrantyExpiry: '',
    manufacturer: '',
    model: '',
    supplier: '',
    notes: '',
    documents: []
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id]);

  useEffect(() => {
    // Update available categories when type changes
    if (asset.type && assetCategories[asset.type as keyof typeof assetCategories]) {
      setSelectedCategories(assetCategories[asset.type as keyof typeof assetCategories]);
      // Reset category if it's not in the new list
      if (!assetCategories[asset.type as keyof typeof assetCategories].includes(asset.category)) {
        setAsset(prev => ({ ...prev, category: '' }));
      }
    } else {
      setSelectedCategories([]);
    }
  }, [asset.type]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!asset.name.trim()) errors.name = 'Asset name is required';
    if (!asset.type) errors.type = 'Asset type is required';
    if (!asset.category) errors.category = 'Category is required';
    if (!asset.status) errors.status = 'Status is required';
    
    // Only validate purchase cost if provided
    if (asset.purchaseDate && !asset.purchaseCost) {
      errors.purchaseCost = 'Purchase cost is required when purchase date is provided';
    }
    
    // Only validate warranty expiry if provided
    if (asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date()) {
      errors.warrantyExpiry = 'Warranty expiry date cannot be in the past';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!id || !property) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the asset
      const newAsset = await createAsset({
        propertyId: id,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        tagId: asset.tagId,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate,
        purchaseCost: asset.purchaseCost,
        currentValue: asset.currentValue || asset.purchaseCost, // Default to purchase cost if not provided
        location: asset.location,
        status: asset.status,
        condition: asset.condition,
        warrantyExpiry: asset.warrantyExpiry,
        manufacturer: asset.manufacturer,
        model: asset.model,
        supplier: asset.supplier,
        notes: asset.notes
      });
      
      if (!newAsset) {
        throw new Error('Failed to create asset');
      }
      
      // Upload documents
      for (const file of asset.documents) {
        await uploadDocument(id, file, 'asset', {
          assetId: newAsset.id
        });
      }

      // Navigate back to the asset list
      navigate(`/properties/${id}/assets`);
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAsset(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setAsset(prev => ({
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

  if (!property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-pastel-dusty">Property Not Found</h2>
        <p className="text-pastel-gray mt-2">The property you're looking for doesn't exist.</p>
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
              onClick={() => navigate(`/properties/${id}/assets`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Asset</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Building2 size={14} className="mr-1.5" />
                <span>{property.name}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={18} />
            <span>{isSubmitting ? 'Creating...' : 'Create Asset'}</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Asset Name
              </label>
              <input
                type="text"
                value={asset.name}
                onChange={(e) => setAsset(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter asset name"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Asset Type
                </label>
                <select
                  value={asset.type}
                  onChange={(e) => setAsset(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="">Select asset type</option>
                  {assetTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Category
                </label>
                <select
                  value={asset.category}
                  onChange={(e) => setAsset(prev => ({ ...prev, category: e.target.value }))}
                  disabled={!asset.type}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select category</option>
                  {selectedCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Tag ID
                </label>
                <input
                  type="text"
                  value={asset.tagId}
                  onChange={(e) => setAsset(prev => ({ ...prev, tagId: e.target.value }))}
                  placeholder="Enter asset tag ID"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={asset.serialNumber}
                  onChange={(e) => setAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="Enter serial number"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Status
                </label>
                <select
                  value={asset.status}
                  onChange={(e) => setAsset(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disposed">Disposed</option>
                  <option value="transferred">Transferred</option>
                </select>
                {formErrors.status && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Condition
                </label>
                <select
                  value={asset.condition}
                  onChange={(e) => setAsset(prev => ({ ...prev, condition: e.target.value as any }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Location
              </label>
              <input
                type="text"
                value={asset.location}
                onChange={(e) => setAsset(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter asset location"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={asset.manufacturer}
                  onChange={(e) => setAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Enter manufacturer"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={asset.model}
                  onChange={(e) => setAsset(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Enter model"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={asset.supplier}
                  onChange={(e) => setAsset(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Enter supplier"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={asset.purchaseDate}
                  onChange={(e) => setAsset(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Purchase Cost
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={asset.purchaseCost || ''}
                    onChange={(e) => setAsset(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray">
                    {property.currency.symbol}
                  </span>
                </div>
                {formErrors.purchaseCost && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.purchaseCost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Current Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={asset.currentValue || ''}
                    onChange={(e) => setAsset(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray">
                    {property.currency.symbol}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Warranty Expiry
              </label>
              <input
                type="date"
                value={asset.warrantyExpiry}
                onChange={(e) => setAsset(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.warrantyExpiry && (
                <p className="mt-1 text-xs text-red-500">{formErrors.warrantyExpiry}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Notes
              </label>
              <textarea
                value={asset.notes}
                onChange={(e) => setAsset(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Enter any additional notes about this asset"
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
              
              {asset.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {asset.documents.map((doc, index) => (
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

export default AssetNew;