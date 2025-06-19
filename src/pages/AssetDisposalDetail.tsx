import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, FileText, DollarSign, 
  Eye, Download, Clock, CheckCircle2, XCircle,
  Calendar, User, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import ApprovalWorkflow from '../components/workflow/ApprovalWorkflow';
import { loadAssetDisposals, AssetDisposal } from '../utils/assetDisposal';
import { loadDocuments } from '../utils/documents';
import { getPropertyById } from '../utils/properties';
import { WorkflowService } from '../services/workflowService';

const AssetDisposalDetail = () => {
  const { id, disposalId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disposal, setDisposal] = useState<AssetDisposal | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any | null>(null);

  useEffect(() => {
    const fetchDisposalDetails = async () => {
      if (!id || !disposalId) return;
      
      setLoading(true);
      try {
        // Load the property
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
        
        // Load the disposal
        const disposals = await loadAssetDisposals(id);
        const selectedDisposal = disposals.find(d => d.id === disposalId);
        
        if (selectedDisposal) {
          setDisposal(selectedDisposal);
          
          // Load workflow data
          if (selectedDisposal.workflowId) {
            const workflowData = await WorkflowService.getWorkflowInstance(selectedDisposal.workflowId);
            if (workflowData) {
              setWorkflow(workflowData);
            }
          }
          
          // Load documents for this disposal
          const docs = await loadDocuments(id, 'disposal');
          const disposalDocs = docs.filter(doc => 
            doc.metadata && doc.metadata.disposalId === disposalId
          );
          
          setDocuments(disposalDocs.map(doc => ({
            name: doc.name,
            url: `${supabase.storage.from('documents').getPublicUrl(doc.path).data.publicUrl}`,
            size: formatFileSize(doc.size)
          })));
        }
      } catch (error) {
        console.error('Error loading disposal details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisposalDetails();
  }, [id, disposalId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleApprove = async (stepIndex: number, comment: string) => {
    if (!workflow || !disposal) return;
    
    setLoading(true);
    try {
      const success = await WorkflowService.updateWorkflowStep(
        workflow.id,
        stepIndex,
        'approved',
        comment
      );
      
      if (success) {
        // Refresh the data
        const disposals = await loadAssetDisposals(id || '');
        const updatedDisposal = disposals.find(d => d.id === disposalId);
        if (updatedDisposal) {
          setDisposal(updatedDisposal);
        }
        
        // Refresh workflow data
        const workflowData = await WorkflowService.getWorkflowInstance(workflow.id);
        if (workflowData) {
          setWorkflow(workflowData);
        }
      } else {
        alert('Failed to approve the disposal request. Please try again.');
      }
    } catch (error) {
      console.error('Error approving disposal request:', error);
      alert('An error occurred while approving the disposal request.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (stepIndex: number, comment: string) => {
    if (!workflow || !disposal) return;
    
    setLoading(true);
    try {
      const success = await WorkflowService.updateWorkflowStep(
        workflow.id,
        stepIndex,
        'rejected',
        comment
      );
      
      if (success) {
        // Refresh the data
        const disposals = await loadAssetDisposals(id || '');
        const updatedDisposal = disposals.find(d => d.id === disposalId);
        if (updatedDisposal) {
          setDisposal(updatedDisposal);
        }
        
        // Refresh workflow data
        const workflowData = await WorkflowService.getWorkflowInstance(workflow.id);
        if (workflowData) {
          setWorkflow(workflowData);
        }
      } else {
        alert('Failed to reject the disposal request. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting disposal request:', error);
      alert('An error occurred while rejecting the disposal request.');
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

  if (!disposal || !property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-pastel-dusty">Disposal Not Found</h2>
        <p className="text-pastel-gray mt-2">The disposal request you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(`/properties/${id}/disposal`)}
          className="mt-4 px-4 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty"
        >
          Back to Disposals
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pastel-peach bg-opacity-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/properties/${id}/disposal`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">Asset Disposal Details</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Building2 size={14} className="mr-1.5" />
                <span>{property.name} • {disposal.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`px-6 py-4 rounded-lg ${
            disposal.status === 'approved' ? 'bg-green-50' :
            disposal.status === 'rejected' ? 'bg-red-50' :
            'bg-amber-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {disposal.status === 'approved' && (
                  <CheckCircle2 size={20} className="text-green-600 mr-2" />
                )}
                {disposal.status === 'rejected' && (
                  <XCircle size={20} className="text-red-600 mr-2" />
                )}
                {disposal.status === 'pending' && (
                  <Clock size={20} className="text-amber-600 mr-2" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${
                    disposal.status === 'approved' ? 'text-green-800' :
                    disposal.status === 'rejected' ? 'text-red-800' :
                    'text-amber-800'
                  }`}>
                    {disposal.status.charAt(0).toUpperCase() + disposal.status.slice(1)}
                  </h3>
                  <p className={`text-xs ${
                    disposal.status === 'approved' ? 'text-green-600' :
                    disposal.status === 'rejected' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    Last updated on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Details */}
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <h3 className="text-lg font-medium text-pastel-dusty mb-6">Asset Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-sm font-medium text-pastel-gray mb-4">Asset Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-pastel-gray">Asset Type</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.assetType}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Asset Tag/ID</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.assetTagId}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Description</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.assetDescription}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Quantity</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.quantity} units</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-pastel-gray mb-4">Disposal Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-pastel-gray">Net Book Value</label>
                    <p className="text-sm text-pastel-dusty mt-1">${Number(disposal.netBookValue).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Disposable Value</label>
                    <p className="text-sm text-pastel-dusty mt-1">${Number(disposal.disposableValue).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Vendor</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.vendor}</p>
                  </div>
                  <div>
                    <label className="text-xs text-pastel-gray">Reason for Disposal</label>
                    <p className="text-sm text-pastel-dusty mt-1">{disposal.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <h3 className="text-lg font-medium text-pastel-dusty mb-4">Submission Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <User size={20} className="text-pastel-gray" />
                <div>
                  <p className="text-sm text-pastel-gray">Submitted By</p>
                  <p className="text-sm font-medium text-pastel-dusty">User ID: {disposal.createdBy}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Calendar size={20} className="text-pastel-gray" />
                <div>
                  <p className="text-sm text-pastel-gray">Submission Date</p>
                  <p className="text-sm font-medium text-pastel-dusty">{new Date(disposal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <h3 className="text-lg font-medium text-pastel-dusty mb-4">Supporting Documents</h3>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-pastel-pink border-opacity-20 hover:border-pastel-mauve transition-colors"
                >
                  <div className="flex items-center">
                    <FileText size={16} className="text-pastel-gray mr-2" />
                    <span className="text-sm text-pastel-dusty">{doc.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10">
                      <Eye size={16} />
                    </button>
                    <button className="p-1.5 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-4 text-pastel-gray">
                  No documents attached
                </div>
              )}
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            {workflow ? (
              <ApprovalWorkflow
                steps={workflow.steps_data}
                currentStep={workflow.current_step}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ) : (
              <div className="text-center py-6 text-pastel-gray">
                No workflow data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDisposalDetail;