import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, DollarSign, User, Calendar,
  MessageSquare, FileText, X, Download, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import ApprovalWorkflow from '../components/workflow/ApprovalWorkflow';
import { loadCapexRequests, CapexRequest } from '../utils/capex';
import { loadDocuments } from '../utils/documents';
import { getPropertyById } from '../utils/properties';
import { WorkflowService } from '../services/workflowService';

const CapexDetail = () => {
  const { id, capexId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [capex, setCapex] = useState<any | null>(null);
  const [property, setProperty] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<any>({
    totalBudget: 0,
    pendingTransfer: 0,
    approvedTransfer: 0,
    totalApprovedBudget: 0,
    proposalReceived: 0,
    proposalApproved: 0,
    balance: 0,
    utilization: 0
  });

  const fetchCapexDetails = useCallback(async () => {
    if (!id || !capexId) return;
    
    setLoading(true);
    try {
      // Load the property
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);
      
      // Load the capex request
      const capexRequests = await loadCapexRequests(id);
      const selectedCapex = capexRequests.find(c => c.id === capexId);
      
      if (selectedCapex) {
        setCapex(selectedCapex);
        
        // Load workflow data
        if (selectedCapex.workflowId) {
          const workflowData = await WorkflowService.getWorkflowInstance(selectedCapex.workflowId);
          if (workflowData) {
            setWorkflow(workflowData);
          }
        }
        
        // Load documents for this capex
        const docs = await loadDocuments(id, 'capex');
        const capexDocs = docs.filter(doc => 
          doc.metadata && doc.metadata.capexId === capexId
        );
        
        setDocuments(capexDocs.map(doc => ({
          name: doc.name,
          size: formatFileSize(doc.size),
          url: `${supabase.storage.from('documents').getPublicUrl(doc.path).data.publicUrl}`
        })));
        
        // Calculate budget summary
        // In a real app, this would come from the database
        setBudgetSummary({
          totalBudget: Number(selectedCapex.amount) * 2,
          pendingTransfer: 0,
          approvedTransfer: 0,
          totalApprovedBudget: Number(selectedCapex.amount) * 2,
          proposalReceived: Number(selectedCapex.amount),
          proposalApproved: selectedCapex.status === 'approved' ? Number(selectedCapex.amount) : 0,
          balance: Number(selectedCapex.amount) * 2 - Number(selectedCapex.amount),
          utilization: 50
        });
      }
    } catch (error) {
      console.error('Error loading capex details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, capexId]);

  useEffect(() => {
    fetchCapexDetails();
  }, [fetchCapexDetails]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleApprove = async (stepIndex: number, comment: string) => {
    if (!workflow || !capex) return;
    
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
        await fetchCapexDetails();
      } else {
        alert('Failed to approve the capex request. Please try again.');
      }
    } catch (error) {
      console.error('Error approving capex request:', error);
      alert('An error occurred while approving the capex request.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (stepIndex: number, comment: string) => {
    if (!workflow || !capex) return;
    
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
        await fetchCapexDetails();
      } else {
        alert('Failed to reject the capex request. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting capex request:', error);
      alert('An error occurred while rejecting the capex request.');
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

  if (!capex || !property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-pastel-dusty">Capex Request Not Found</h2>
        <p className="text-pastel-gray mt-2">The capex request you're looking for doesn't exist.</p>
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
              onClick={() => navigate(`/properties/${id}/capex`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">{capex.projectName}</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Building2 size={14} className="mr-1.5" />
                <span>{property.name} • {capex.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Budget Provisioned</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.totalBudget.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Pending Transfer</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.pendingTransfer.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Approved Transfer</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.approvedTransfer.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Total Approved Budget</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.totalApprovedBudget.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Proposal Received</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.proposalReceived.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Proposal Approved</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.proposalApproved.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Balance</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {property.currency.symbol} {budgetSummary.balance.toLocaleString()}
                </h3>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${budgetSummary.utilization}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-right text-pastel-gray">
              {budgetSummary.utilization}% utilized
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Utilization (%)</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  {budgetSummary.utilization}%
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-6">
          <h2 className="text-lg font-medium text-pastel-dusty mb-6">Request Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h3 className="text-sm font-medium text-pastel-gray mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-pastel-gray">Project Name</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.projectName}</p>
                </div>
                <div>
                  <label className="text-xs text-pastel-gray">Budget Reference</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.budgetReference}</p>
                </div>
                <div>
                  <label className="text-xs text-pastel-gray">Department</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.department}</p>
                </div>
                <div>
                  <label className="text-xs text-pastel-gray">Project Lead</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.projectLead}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-pastel-gray mb-4">Timeline & Budget</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-pastel-gray">Start Date</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.startDate}</p>
                </div>
                <div>
                  <label className="text-xs text-pastel-gray">End Date</label>
                  <p className="text-sm text-pastel-dusty mt-1">{capex.endDate}</p>
                </div>
                <div>
                  <label className="text-xs text-pastel-gray">Amount</label>
                  <p className="text-sm text-pastel-dusty mt-1">{property.currency.symbol} {Number(capex.amount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-pastel-gray mb-2">Description</h3>
            <p className="text-sm text-pastel-dusty">{capex.description}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-pastel-gray mb-4">Supporting Documents</h3>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-pastel-pink border-opacity-20 hover:border-pastel-mauve transition-colors"
                >
                  <div className="flex items-center">
                    <FileText size={16} className="text-pastel-gray mr-2" />
                    <span className="text-sm text-pastel-dusty">{doc.name}</span>
                    <span className="ml-2 text-xs text-pastel-gray">{doc.size}</span>
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
  );
};

export default CapexDetail;