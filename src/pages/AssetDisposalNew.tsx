import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Upload, X,
  Plus, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredefinedWorkflows from '../components/workflow/PredefinedWorkflows';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import { loadSettings } from '../utils/settings';
import { createAssetDisposal } from '../utils/assetDisposal';
import { uploadDocument } from '../utils/documents';
import { getPropertyById } from '../utils/properties';
import { WorkflowService } from '../services/workflowService';

interface NewDisposalRequest {
  assetType: string;
  assetDescription: string;
  assetTagId: string;
  netBookValue: number;
  disposableValue: number;
  quantity: number;
  vendor: string;
  reason: string;
  documents: File[];
  workflowTemplate: string | null;
}

const AssetDisposalNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const settings = loadSettings();

  const [disposal, setDisposal] = useState<NewDisposalRequest>({
    assetType: '',
    assetDescription: '',
    assetTagId: '',
    netBookValue: 0,
    disposableValue: 0,
    quantity: 1,
    vendor: '',
    reason: '',
    documents: [],
    workflowTemplate: null
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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!disposal.assetType) errors.assetType = 'Asset type is required';
    if (!disposal.assetDescription) errors.assetDescription = 'Description is required';
    if (!disposal.assetTagId) errors.assetTagId = 'Asset Tag/ID is required';
    if (!disposal.netBookValue || disposal.netBookValue <= 0) errors.netBookValue = 'Valid net book value is required';
    if (!disposal.disposableValue || disposal.disposableValue < 0) errors.disposableValue = 'Valid disposable value is required';
    if (!disposal.quantity || disposal.quantity <= 0) errors.quantity = 'Valid quantity is required';
    if (!disposal.vendor) errors.vendor = 'Vendor is required';
    if (!disposal.reason) errors.reason = 'Reason for disposal is required';
    if (!selectedWorkflow) errors.workflow = 'Workflow template is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!id) return;
    
    setLoading(true);
    
    try {
      // Create the asset disposal
      const newDisposal = await createAssetDisposal({
        propertyId: id,
        assetType: disposal.assetType,
        assetDescription: disposal.assetDescription,
        assetTagId: disposal.assetTagId,
        netBookValue: disposal.netBookValue,
        disposableValue: disposal.disposableValue,
        quantity: disposal.quantity,
        vendor: disposal.vendor,
        reason: disposal.reason,
        status: 'draft',
        workflowId: selectedWorkflow || '',
        currentStep: 0
      });
      
      if (!newDisposal) {
        throw new Error('Failed to create asset disposal');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'asset_disposal',
          newDisposal.id
        );
        
        if (workflowId) {
          // Update the asset disposal with the workflow ID
        if (workflowId && newDisposal) {
          // Update the asset disposal with the workflow ID and set status to pending
          await updateAssetDisposal(newDisposal.id, {
            workflowId: workflowId, // Ensure AssetDisposalUpdate and backend accept workflowId
            status: 'pending_approval' // Align with schema status; AssetDisposalStatus type
          });
        }
      }
      
      // Upload documents
      for (const file of disposal.documents) {
        await uploadDocument(id, file, 'disposal', {
          disposalId: newDisposal.id
        });
      }

      // Navigate back to the disposal list
      navigate(`/properties/${id}/disposal`);
    } catch (error) {
      console.error('Error creating asset disposal:', error);
      alert('Failed to create asset disposal. Please try again.');
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/properties/${id}/disposal`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Asset Disposal</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Building2 size={14} className="mr-1.5" />
                <span>{property.name}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span className="font-medium">{loading ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </div>

        {/* Asset Details Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-8">
          <h2 className="text-lg font-medium text-pastel-dusty mb-6">Asset Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Asset Type
                </label>
                <select
                  value={disposal.assetType}
                  onChange={(e) => setDisposal({ ...disposal, assetType: e.target.value })}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="">Select asset type</option>
                  {settings.disposalCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name} ({cat.code})</option>
                  ))}
                </select>
                {formErrors.assetType && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.assetType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Asset Tag/ID
                </label>
                <input
                  type="text"
                  value={disposal.assetTagId}
                  onChange={(e) => setDisposal({ ...disposal, assetTagId: e.target.value })}
                  placeholder="Enter asset tag or ID"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.assetTagId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.assetTagId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Description
                </label>
                <textarea
                  value={disposal.assetDescription}
                  onChange={(e) => setDisposal({ ...disposal, assetDescription: e.target.value })}
                  placeholder="Describe the asset"
                  rows={3}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.assetDescription && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.assetDescription}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={disposal.quantity}
                  onChange={(e) => setDisposal({ ...disposal, quantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Net Book Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={disposal.netBookValue}
                    onChange={(e) => setDisposal({ ...disposal, netBookValue: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray" />
                </div>
                {formErrors.netBookValue && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.netBookValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Disposable Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={disposal.disposableValue}
                    onChange={(e) => setDisposal({ ...disposal, disposableValue: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray" />
                </div>
                {formErrors.disposableValue && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.disposableValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={disposal.vendor}
                  onChange={(e) => setDisposal({ ...disposal, vendor: e.target.value })}
                  placeholder="Enter vendor name"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.vendor && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.vendor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Reason for Disposal
                </label>
                <textarea
                  value={disposal.reason}
                  onChange={(e) => setDisposal({ ...disposal, reason: e.target.value })}
                  placeholder="Explain why this asset needs to be disposed"
                  rows={3}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.reason && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.reason}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-8">
          <h2 className="text-lg font-medium text-pastel-dusty mb-4">Supporting Documents</h2>
          
          <div className="p-6 border-2 border-pastel-pink border-opacity-20 border-dashed rounded-lg text-center hover:border-pastel-mauve transition-colors">
            <Upload size={32} className="mx-auto text-pastel-gray mb-3" />
            <div className="text-sm text-pastel-gray">
              <label htmlFor="file-upload" className="relative cursor-pointer text-pastel-mauve hover:text-pastel-dusty font-medium">
                <span>Upload a file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setDisposal(prev => ({
                      ...prev,
                      documents: [...prev.documents, ...files]
                    }));
                  }}
                  multiple
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-pastel-gray mt-2">
              PDF, DOC up to 10MB
            </p>
          </div>

          {disposal.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {disposal.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-pastel-peach bg-opacity-5 group hover:bg-opacity-10 transition-colors">
                  <span className="text-sm text-pastel-dusty truncate">{doc.name}</span>
                  <button
                    onClick={() => {
                      const newDocs = [...disposal.documents];
                      newDocs.splice(index, 1);
                      setDisposal(prev => ({
                        ...prev,
                        documents: newDocs
                      }));
                    }}
                    className="p-1.5 text-pastel-gray opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all rounded-full hover:bg-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <PredefinedWorkflows
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow.id);
                setWorkflowSteps(workflow.steps);
                setDisposal(prev => ({
                  ...prev,
                  workflowTemplate: workflow.id
                }));
              }}
              selectedId={selectedWorkflow}
            />
            {formErrors.workflow && (
              <p className="mt-2 text-xs text-red-500">{formErrors.workflow}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <WorkflowBuilder
              steps={workflowSteps}
              onStepsChange={setWorkflowSteps}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDisposalNew;