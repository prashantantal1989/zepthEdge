import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Building2, 
  DollarSign, FileText, UploadCloud, X 
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredefinedWorkflows from '../components/workflow/PredefinedWorkflows';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import { loadSettings } from '../utils/settings';
import { createBudgetTransfer, loadBudgets } from '../utils/budgets';
import { getPropertyById } from '../utils/properties';
import { uploadDocument } from '../utils/documents';
import { currencies } from '../types/property';
import { WorkflowService } from '../services/workflowService';

interface TransferRequest {
  refNo: string;
  fromBudget: string;
  toBudget: string;
  amount: number;
  reason: string;
  documents: File[];
  workflowTemplate: string | null;
}

const BudgetTransfer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Partial<TransferRequest>>({});
  const settings = loadSettings();
  
  const [transfer, setTransfer] = useState<TransferRequest>({
    refNo: `TRF-${new Date().getFullYear()}-001`,
    fromBudget: '',
    toBudget: '',
    amount: 0,
    reason: '',
    documents: [],
    workflowTemplate: null
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Load property
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
        
        // Load budgets
        const budgetsData = await loadBudgets(id, new Date().getFullYear());
        setBudgets(budgetsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    const errors: Partial<TransferRequest> = {};
    
    if (!transfer.fromBudget) errors.fromBudget = 'Source budget is required';
    if (!transfer.toBudget) errors.toBudget = 'Destination budget is required';
    if (!transfer.amount || transfer.amount <= 0) errors.amount = 'Valid amount is required';
    if (!transfer.reason) errors.reason = 'Transfer reason is required';
    if (!selectedWorkflow) errors.workflowTemplate = 'Workflow template is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!id || !property) return;
    
    setLoading(true);
    
    try {
      // Create the budget transfer
      const newTransfer = await createBudgetTransfer({
        propertyId: id,
        fromBudgetId: transfer.fromBudget,
        toBudgetId: transfer.toBudget,
        amount: transfer.amount,
        reason: transfer.reason,
        status: 'draft',
        workflowId: selectedWorkflow || '',
        currentStep: 0
      });
      
      if (!newTransfer) {
        throw new Error('Failed to create budget transfer');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'budget_transfer',
          newTransfer.id
        );
        
        if (workflowId) {
          // Update the budget transfer with the workflow ID
          await supabase
            .from('budget_transfers')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newTransfer.id);
        }
      }
      
      // Upload documents
      for (const file of transfer.documents) {
        await uploadDocument(id, file, 'budget_transfer', {
          transferId: newTransfer.id
        });
      }
    
      // Navigate back to the budget list
      navigate(`/properties/${id}/budget`);
    } catch (error) {
      console.error('Error creating budget transfer:', error);
      alert('Failed to create budget transfer. Please try again.');
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
              onClick={() => navigate(`/properties/${id}/budget`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">Budget Transfer</h1>
              <div className="flex items-center mt-1 text-sm text-pastel-gray">
                <Building2 size={14} className="mr-1.5" />
                <span>{property.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={transfer.refNo}
                  readOnly
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 bg-pastel-peach bg-opacity-5 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-pastel-gray mb-1">
                    From Budget
                  </label>
                  <select
                    value={transfer.fromBudget}
                    onChange={(e) => setTransfer({ ...transfer, fromBudget: e.target.value })}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                  >
                    <option value="">Select source budget</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.category} ({budget.code}) - {property.currency.symbol}{Number(budget.totalBudget).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {formErrors.fromBudget && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.fromBudget}</p>
                  )}
                </div>

                <div className="flex items-center justify-center pt-6">
                  <ArrowRight size={24} className="text-pastel-gray" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pastel-gray mb-1">
                    To Budget
                  </label>
                  <select
                    value={transfer.toBudget}
                    onChange={(e) => setTransfer({ ...transfer, toBudget: e.target.value })}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                  >
                    <option value="">Select destination budget</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.category} ({budget.code}) - {property.currency.symbol}{Number(budget.totalBudget).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {formErrors.toBudget && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.toBudget}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Transfer Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transfer.amount || ''}
                    onChange={(e) => setTransfer({ ...transfer, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray">
                    {property.currency.symbol}
                  </span>
                </div>
                {formErrors.amount && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Transfer Reason
                </label>
                <textarea
                  value={transfer.reason}
                  onChange={(e) => setTransfer({ ...transfer, reason: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                  placeholder="Explain the reason for this budget transfer..."
                />
                {formErrors.reason && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.reason}</p>
                )}
              </div>
            </div>

            {/* Supporting Documents */}
            <div>
              <h2 className="text-lg font-medium text-pastel-dusty mb-4">Supporting Documents</h2>
              
              <div className="p-4 border-2 border-pastel-pink border-opacity-20 border-dashed rounded-lg text-center">
                <UploadCloud size={24} className="mx-auto text-pastel-gray mb-2" />
                <div className="text-sm text-pastel-gray">
                  <label htmlFor="file-upload" className="relative cursor-pointer text-pastel-mauve hover:text-pastel-dusty">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setTransfer({ ...transfer, documents: [...transfer.documents, ...files] });
                      }}
                      multiple
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-pastel-gray mt-1">
                  PDF, DOC up to 10MB
                </p>
              </div>

              {transfer.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {transfer.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-pastel-peach bg-opacity-5">
                      <div className="flex items-center">
                        <FileText size={16} className="text-pastel-gray mr-2" />
                        <span className="text-sm text-pastel-dusty truncate">{doc.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          const newDocs = [...transfer.documents];
                          newDocs.splice(index, 1);
                          setTransfer({ ...transfer, documents: newDocs });
                        }}
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

        {/* Workflow Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <PredefinedWorkflows
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow.id);
                setWorkflowSteps(workflow.steps);
                setTransfer(prev => ({
                  ...prev,
                  workflowTemplate: workflow.id
                }));
              }}
              selectedId={selectedWorkflow}
            />
            {formErrors.workflowTemplate && (
              <p className="mt-2 text-xs text-red-500">{formErrors.workflowTemplate}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <WorkflowBuilder
              steps={workflowSteps}
              onStepsChange={setWorkflowSteps}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Transfer Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetTransfer;