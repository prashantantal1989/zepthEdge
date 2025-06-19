import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, X, Plus, DollarSign, 
  FileText, UploadCloud, Trash2, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredefinedWorkflows from '../components/workflow/PredefinedWorkflows';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import { loadSettings } from '../utils/settings';
import { createBudgetRequest } from '../utils/budgets';
import { getPropertyById } from '../utils/properties';
import { uploadDocument } from '../utils/documents';
import { currencies } from '../types/property';
import { WorkflowService } from '../services/workflowService';

interface BudgetItem {
  id: string;
  refNo: string;
  description: string;
  amount: number;
  dueDate: string;
  documents: File[];
}

interface NewBudgetRequest {
  category: string;
  currency: string;
  items: BudgetItem[];
  documents: File[];
  workflowTemplate: string | null;
}

const BudgetNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const settings = loadSettings();
  
  const [budgetRequest, setBudgetRequest] = useState<NewBudgetRequest>({
    category: '',
    currency: 'USD',
    items: [
      {
        id: '1',
        refNo: '',
        description: '',
        amount: 0,
        dueDate: '',
        documents: []
      }
    ],
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
        
        // Set default currency from property
        if (propertyData && propertyData.currency) {
          setBudgetRequest(prev => ({
            ...prev,
            currency: propertyData.currency.code
          }));
        }
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id]);

  const addBudgetItem = () => {
    setBudgetRequest(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: String(prev.items.length + 1),
          refNo: '',
          description: '',
          amount: 0,
          dueDate: '',
          documents: []
        }
      ]
    }));
  };

  const removeBudgetItem = (id: string) => {
    if (budgetRequest.items.length === 1) {
      return; // Keep at least one item
    }
    setBudgetRequest(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateBudgetItem = (id: string, field: keyof BudgetItem, value: any) => {
    setBudgetRequest(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleItemDocumentUpload = (itemId: string, files: FileList) => {
    setBudgetRequest(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, documents: [...item.documents, ...Array.from(files)] }
          : item
      )
    }));
  };

  const removeItemDocument = (itemId: string, documentIndex: number) => {
    setBudgetRequest(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? {
              ...item,
              documents: item.documents.filter((_, index) => index !== documentIndex)
            }
          : item
      )
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!budgetRequest.category) {
      errors.category = 'Category is required';
    }

    budgetRequest.items.forEach((item, index) => {
      if (!item.refNo) {
        errors[`refNo-${index}`] = 'Reference number is required';
      }
      if (!item.description) {
        errors[`description-${index}`] = 'Description is required';
      }
      if (!item.amount || item.amount <= 0) {
        errors[`amount-${index}`] = 'Valid amount is required';
      }
      if (!item.dueDate) {
        errors[`dueDate-${index}`] = 'Due date is required';
      }
    });

    if (!selectedWorkflow) {
      errors.workflow = 'Workflow template is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!id || !property) return;
    
    setLoading(true);
    
    try {
      // Find the budget ID for the selected category
      const budgetCategory = settings.budgetCategories.find(cat => cat.name === budgetRequest.category);
      if (!budgetCategory) {
        throw new Error('Invalid budget category');
      }
      
      // Create the budget request
      const newBudgetRequest = await createBudgetRequest({
        propertyId: id,
        budgetId: budgetCategory.id, // This would need to be the actual budget ID from the database
        title: budgetRequest.items[0].description, // Use the first item's description as the title
        description: budgetRequest.items.map(item => item.description).join(', '),
        amount: budgetRequest.items.reduce((sum, item) => sum + item.amount, 0),
        status: 'draft',
        workflowId: selectedWorkflow || '',
        currentStep: 0
      });
      
      if (!newBudgetRequest) {
        throw new Error('Failed to create budget request');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'budget_request',
          newBudgetRequest.id
        );
        
        if (workflowId) {
          // Update the budget request with the workflow ID
          await supabase
            .from('budget_requests')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newBudgetRequest.id);
        }
      }
      
      // Upload documents
      for (const file of budgetRequest.documents) {
        await uploadDocument(id, file, 'budget', {
          budgetId: newBudgetRequest.id
        });
      }
      
      // Upload item documents
      for (const item of budgetRequest.items) {
        for (const file of item.documents) {
          await uploadDocument(id, file, 'budget', {
            budgetId: newBudgetRequest.id,
            itemId: item.id
          });
        }
      }
    
      // Navigate back to the budget list
      navigate(`/properties/${id}/budget`);
    } catch (error) {
      console.error('Error creating budget request:', error);
      alert('Failed to create budget request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = budgetRequest.items.reduce((sum, item) => sum + item.amount, 0);

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
              <X size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Budget Request</h1>
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

        {/* Budget Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-lg font-medium text-pastel-dusty">Budget Items</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <label className="block text-sm font-medium text-pastel-gray mb-1">Category</label>
                <div className="relative">
                  <select
                    value={budgetRequest.category}
                    onChange={(e) => setBudgetRequest(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full appearance-none bg-white pl-4 pr-10 py-2.5 rounded-lg border-2 border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring focus:ring-pastel-mauve focus:ring-opacity-50 text-pastel-dusty font-medium transition-all duration-200 hover:border-pastel-mauve cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {settings.budgetCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name} ({cat.code})</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-pastel-gray pointer-events-none" />
                </div>
                {formErrors.category && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
                )}
              </div>
              
              <div className="relative group flex-1 sm:flex-none">
                <label className="block text-sm font-medium text-pastel-gray mb-1">Currency</label>
                <div className="relative">
                  <select
                    value={budgetRequest.currency}
                    onChange={(e) => setBudgetRequest(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full appearance-none bg-white pl-4 pr-10 py-2.5 rounded-lg border-2 border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring focus:ring-pastel-mauve focus:ring-opacity-50 text-pastel-dusty font-medium transition-all duration-200 hover:border-pastel-mauve cursor-pointer"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-pastel-gray pointer-events-none" />
                </div>
              </div>
              
              <div className="sm:self-end">
                <button
                  onClick={addBudgetItem}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-pastel-mauve text-pastel-mauve rounded-lg flex items-center justify-center gap-2 hover:bg-pastel-mauve hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <Plus size={18} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                <col className="w-[15%]" /> {/* Ref No */}
                <col className="w-[35%]" /> {/* Description */}
                <col className="w-[12%]" /> {/* Amount */}
                <col className="w-[13%]" /> {/* Due Date */}
                <col className="w-[17%]" /> {/* Documents */}
                <col className="w-[8%]" />  {/* Actions */}
              </colgroup>
              <thead>
                <tr className="border-b-2 border-pastel-pink border-opacity-20">
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Ref No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Documents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pastel-pink divide-opacity-20">
                {budgetRequest.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-pastel-peach hover:bg-opacity-5">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.refNo}
                        onChange={(e) => updateBudgetItem(item.id, 'refNo', e.target.value)}
                        placeholder="Enter ref no"
                        className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve text-sm"
                      />
                      {formErrors[`refNo-${index}`] && (
                        <p className="mt-1 text-xs text-red-500">{formErrors[`refNo-${index}`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateBudgetItem(item.id, 'description', e.target.value)}
                        placeholder="Enter description"
                        className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve text-sm"
                      />
                      {formErrors[`description-${index}`] && (
                        <p className="mt-1 text-xs text-red-500">{formErrors[`description-${index}`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateBudgetItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve text-sm pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-gray">
                          {currencies.find(c => c.code === budgetRequest.currency)?.symbol}
                        </span>
                      </div>
                      {formErrors[`amount-${index}`] && (
                        <p className="mt-1 text-xs text-red-500">{formErrors[`amount-${index}`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateBudgetItem(item.id, 'dueDate', e.target.value)}
                        className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve text-sm"
                      />
                      {formErrors[`dueDate-${index}`] && (
                        <p className="mt-1 text-xs text-red-500">{formErrors[`dueDate-${index}`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-2">
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) => e.target.files && handleItemDocumentUpload(item.id, e.target.files)}
                            multiple
                          />
                          <div className="px-3 py-1.5 bg-white border border-pastel-pink border-opacity-20 text-pastel-gray rounded-lg hover:border-pastel-mauve hover:text-pastel-mauve transition-colors flex items-center gap-1 text-sm">
                            <UploadCloud size={14} />
                            <span>Upload</span>
                          </div>
                        </label>
                        {item.documents.length > 0 && (
                          <div className="space-y-1">
                            {item.documents.map((doc, docIndex) => (
                              <div key={docIndex} className="flex items-center justify-between text-xs">
                                <span className="truncate text-pastel-gray">{doc.name}</span>
                                <button
                                  onClick={() => removeItemDocument(item.id, docIndex)}
                                  className="ml-2 text-pastel-gray hover:text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeBudgetItem(item.id)}
                        className="p-2 rounded-lg text-pastel-gray hover:bg-red-50 hover:text-red-500 transition-colors"
                        disabled={budgetRequest.items.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-pastel-pink border-opacity-20">
                  <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-pastel-gray">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-pastel-dusty">
                      {currencies.find(c => c.code === budgetRequest.currency)?.symbol}
                      {totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6 mb-8">
          <h2 className="text-lg font-medium text-pastel-dusty mb-4">Supporting Documents</h2>
          
          <div className="p-6 border-2 border-pastel-pink border-opacity-20 border-dashed rounded-lg text-center hover:border-pastel-mauve transition-colors">
            <UploadCloud size={32} className="mx-auto text-pastel-gray mb-3" />
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
                    setBudgetRequest(prev => ({
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

          {budgetRequest.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {budgetRequest.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-pastel-peach bg-opacity-5 group hover:bg-opacity-10 transition-colors">
                  <div className="flex items-center">
                    <FileText size={16} className="text-pastel-gray mr-2" />
                    <span className="text-sm text-pastel-dusty truncate">{doc.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      const newDocs = [...budgetRequest.documents];
                      newDocs.splice(index, 1);
                      setBudgetRequest(prev => ({
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
                setBudgetRequest(prev => ({
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

export default BudgetNew;