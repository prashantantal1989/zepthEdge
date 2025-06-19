import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, UploadCloud, 
  CheckCircle, XCircle, Building2,
  Calendar, User, DollarSign, FileText, Eye,
  Clock, AlertCircle, Download as DownloadIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import ApprovalWorkflow from '../components/workflow/ApprovalWorkflow';
import { loadBudgetRequests, BudgetRequest } from '../utils/budgets';
import { loadDocuments } from '../utils/documents';
import { getPropertyById } from '../utils/properties';
import { WorkflowService } from '../services/workflowService';

interface BudgetItem {
  id: string;
  refNo: string;
  description: string;
  amount: number;
  dueDate: string;
  documents: {
    name: string;
    url: string;
  }[];
}

const BudgetDetail = () => {
  const { id, budgetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<any | null>(null);
  const [property, setProperty] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [workflow, setWorkflow] = useState<any | null>(null);

  const fetchBudgetDetails = useCallback(async () => {
    if (!id || !budgetId) return;
    
    setLoading(true);
    try {
      // Load the property
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);
      
      // Load the budget request
      const budgetRequests = await loadBudgetRequests(id);
      const selectedBudget = budgetRequests.find(b => b.id === budgetId);
      
      if (selectedBudget) {
        setBudget(selectedBudget);
        
        // Load workflow data
        if (selectedBudget.workflowId) {
          const workflowData = await WorkflowService.getWorkflowInstance(selectedBudget.workflowId);
          if (workflowData) {
            setWorkflow(workflowData);
          }
        }
        
        // Load documents for this budget
        const docs = await loadDocuments(id, 'budget');
        const budgetDocs = docs.filter(doc => 
          doc.metadata && doc.metadata.budgetId === budgetId
        );
        
        setDocuments(budgetDocs.map(doc => ({
          name: doc.name,
          // Assuming doc.path from loadDocuments (now API-driven) will be the direct public URL
          // or a new field like doc.publicUrl will be provided by the API.
          // TODO: Adjust if the API returns a path that needs further processing
          // via a new utility function e.g. getPublicUrl(doc.path) which calls a backend helper.
          url: doc.path, // Or doc.publicUrl if the API provides that
          size: formatFileSize(doc.size)
        })));
        
        // Create budget items from metadata
        if (selectedBudget.metadata && selectedBudget.metadata.items) {
          setItems(selectedBudget.metadata.items);
        } else {
          // Create a single item if no items in metadata
          setItems([{
            id: '1',
            refNo: selectedBudget.id.substring(0, 8),
            description: selectedBudget.title,
            amount: selectedBudget.amount,
            dueDate: new Date().toISOString().split('T')[0],
            documents: []
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading budget details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, budgetId]);

  useEffect(() => {
    fetchBudgetDetails();
  }, [fetchBudgetDetails]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleApprove = async (stepIndex: number, comment: string) => {
    if (!workflow || !budget) return;
    
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
        await fetchBudgetDetails();
      } else {
        alert('Failed to approve the budget request. Please try again.');
      }
    } catch (error) {
      console.error('Error approving budget request:', error);
      alert('An error occurred while approving the budget request.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (stepIndex: number, comment: string) => {
    if (!workflow || !budget) return;
    
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
        await fetchBudgetDetails();
      } else {
        alert('Failed to reject the budget request. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting budget request:', error);
      alert('An error occurred while rejecting the budget request.');
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

  if (!budget || !property) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-pastel-dusty">Budget Not Found</h2>
          <p className="mt-2 text-pastel-gray">The budget request you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/properties/${id}/budget`)}
            className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-pastel-dusty">Budget Details</h1>
            <div className="flex items-center mt-1 text-sm text-pastel-gray">
              <Building2 size={14} className="mr-1.5" />
              <span>{property.name} • {budget.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`px-6 py-4 rounded-lg ${
          budget.status === 'approved' ? 'bg-green-50' :
          budget.status === 'rejected' ? 'bg-red-50' :
          'bg-amber-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {budget.status === 'approved' && (
                <CheckCircle size={20} className="text-green-600 mr-2" />
              )}
              {budget.status === 'rejected' && (
                <XCircle size={20} className="text-red-600 mr-2" />
              )}
              {budget.status === 'pending' && (
                <Clock size={20} className="text-amber-600 mr-2" />
              )}
              <div>
                <h3 className={`text-sm font-medium ${
                  budget.status === 'approved' ? 'text-green-800' :
                  budget.status === 'rejected' ? 'text-red-800' :
                  'text-amber-800'
                }`}>
                  {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                </h3>
                <p className={`text-xs ${
                  budget.status === 'approved' ? 'text-green-600' :
                  budget.status === 'rejected' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  Last updated on {new Date(budget.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-pastel-dusty">Budget ID</p>
              <p className="text-xs text-pastel-gray">{budget.budgetId}</p>
            </div>
          </div>
        </div>

        {/* Budget Items */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
          <div className="px-6 py-4 border-b border-pastel-pink border-opacity-20">
            <h3 className="text-lg font-medium text-pastel-dusty">Budget Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pastel-pink border-opacity-20">
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Ref No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pastel-pink divide-opacity-20">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-pastel-peach hover:bg-opacity-5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-pastel-dusty">{item.refNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-pastel-dusty">{item.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-pastel-dusty">
                        {property.currency.symbol} {item.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-gray">{item.dueDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.documents.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-pastel-gray truncate max-w-[200px]">{doc.name}</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.url, '_blank');
                              }}
                              className="p-1 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10"
                              title="View Document"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle download
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.name;
                                link.click();
                              }}
                              className="p-1 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10"
                              title="Download Document"
                            >
                              <DownloadIcon size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-pastel-peach bg-opacity-5">
                  <td colSpan={2} className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-pastel-gray">Total Amount:</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-pastel-dusty">
                      {property.currency.symbol} {totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
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

export default BudgetDetail;