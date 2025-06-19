import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, X, Plus, DollarSign,
  Calendar, User, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredefinedWorkflows from '../components/workflow/PredefinedWorkflows';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import { createCapexRequest } from '../utils/capex';
import { getPropertyById } from '../utils/properties';
import { uploadDocument } from '../utils/documents';
import { loadWorkflowTemplates } from '../utils/workflowTemplates';
import { WorkflowService } from '../services/workflowService';

interface BudgetSummary {
  totalBudget: number;
  pendingTransfer: number;
  approvedTransfer: number;
  proposalReceived: number;
  proposalApproved: number;
  balance: number;
  utilization: number;
}

interface Budget {
  id: string;
  name: string;
  code: string;
  summary: BudgetSummary;
}

interface CapexForm {
  referenceId: string;
  selectedBudget: string;
  approvedBudgetReference: string;
  projectName: string;
  department: string;
  subDepartment: string;
  projectLead: string;
  designConsultant: string;
  mainContractor: string;
  description: string;
  titleArea: string;
  budgetProvision: number;
  startDate: string;
  endDate: string;
  remarks: string;
  documents: File[];
  workflowTemplate: string | null;
}

const departments = [
  'Operations',
  'Facilities',
  'Engineering',
  'Food & Beverage',
  'Housekeeping',
  'Front Office',
  'Sales & Marketing',
  'Finance',
  'Human Resources'
];

const subDepartments = {
  Operations: ['Guest Services', 'Security', 'Parking', 'Valet'],
  Facilities: ['Maintenance', 'HVAC', 'Electrical', 'Plumbing'],
  Engineering: ['Civil', 'Mechanical', 'Electrical', 'Project Management'],
  'Food & Beverage': ['Restaurant', 'Banquet', 'Kitchen', 'Bar'],
  Housekeeping: ['Rooms', 'Public Areas', 'Laundry'],
  'Front Office': ['Reception', 'Concierge', 'Reservations'],
  'Sales & Marketing': ['Corporate Sales', 'Events', 'Digital Marketing'],
  Finance: ['Accounting', 'Purchasing', 'Revenue'],
  'Human Resources': ['Recruitment', 'Training', 'Employee Relations']
};

// Mock budgets data
const mockBudgets: Budget[] = [
  {
    id: 'MAINT',
    name: 'Maintenance',
    code: 'MAINT',
    summary: {
      totalBudget: 220000.00,
      pendingTransfer: 0.00,
      approvedTransfer: 0.00,
      proposalReceived: 0.00,
      proposalApproved: 0.00,
      balance: 220000.00,
      utilization: 0
    }
  },
  {
    id: 'FF&E',
    name: 'F&B Equipment',
    code: 'FF&E',
    summary: {
      totalBudget: 207750.00,
      pendingTransfer: 45000.00,
      approvedTransfer: 0.00,
      proposalReceived: 45000.00,
      proposalApproved: 0.00,
      balance: 162750.00,
      utilization: 21.6
    }
  },
  {
    id: 'ROI',
    name: 'ROI Projects',
    code: 'ROI',
    summary: {
      totalBudget: 290012.00,
      pendingTransfer: 0.00,
      approvedTransfer: 220000.00,
      proposalReceived: 220000.00,
      proposalApproved: 220000.00,
      balance: 70012.00,
      utilization: 75.9
    }
  }
];

const CapexNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  
  const [capex, setCapex] = useState<CapexForm>({
    referenceId: `CPX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    selectedBudget: '',
    approvedBudgetReference: '',
    projectName: '',
    department: '',
    subDepartment: '',
    projectLead: '',
    designConsultant: '',
    mainContractor: '',
    description: '',
    titleArea: '',
    budgetProvision: 0,
    startDate: '',
    endDate: '',
    remarks: '',
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
    
    if (!capex.selectedBudget) errors.selectedBudget = 'Budget category is required';
    if (!capex.approvedBudgetReference) errors.approvedBudgetReference = 'Budget reference is required';
    if (!capex.projectName) errors.projectName = 'Project name is required';
    if (!capex.department) errors.department = 'Department is required';
    if (!capex.subDepartment) errors.subDepartment = 'Sub-department is required';
    if (!capex.projectLead) errors.projectLead = 'Project lead is required';
    if (!capex.description) errors.description = 'Description is required';
    if (!capex.titleArea) errors.titleArea = 'Title/Area is required';
    if (!capex.budgetProvision || capex.budgetProvision <= 0) errors.budgetProvision = 'Valid budget provision is required';
    if (!capex.startDate) errors.startDate = 'Start date is required';
    if (!capex.endDate) errors.endDate = 'End date is required';
    if (!selectedWorkflow) errors.workflow = 'Workflow template is required';

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
      // Create the capex request
      const newCapex = await createCapexRequest({
        propertyId: id,
        budgetId: capex.selectedBudget,
        projectName: capex.projectName,
        category: capex.category || selectedBudget?.name || '',
        budgetReference: capex.approvedBudgetReference,
        amount: capex.budgetProvision,
        startDate: capex.startDate,
        endDate: capex.endDate,
        status: 'draft',
        projectLead: capex.projectLead,
        department: capex.department,
        subDepartment: capex.subDepartment,
        designConsultant: capex.designConsultant,
        mainContractor: capex.mainContractor,
        description: capex.description,
        titleArea: capex.titleArea,
        remarks: capex.remarks,
        workflowId: '', // This will be updated after creating the workflow
        currentStep: 0
      });
      
      if (!newCapex) {
        throw new Error('Failed to create capex request');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'capex_request',
          newCapex.id
        );
        
        if (workflowId) {
          // Update the capex request with the workflow ID
          await supabase
            .from('capex_requests')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newCapex.id);
        }
      }
      
      // Upload documents
      for (const file of capex.documents) {
        await uploadDocument(id, file, 'capex', {
          capexId: newCapex.id
        });
      }

      // Navigate back to the capex list
      navigate(`/properties/${id}/capex`);
    } catch (error) {
      console.error('Error creating capex request:', error);
      alert('Failed to create capex request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setCapex(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setCapex(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleBudgetSelect = (budgetId: string) => {
    const budget = mockBudgets.find(b => b.id === budgetId);
    setSelectedBudget(budget || null);
    setCapex(prev => ({
      ...prev,
      selectedBudget: budgetId,
      approvedBudgetReference: budget ? `${budget.code}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}` : ''
    }));
  };

  useEffect(() => {
    // Load workflow templates and select the default one
    const loadTemplates = async () => {
      const templates = await loadWorkflowTemplates();
      const defaultTemplate = templates.find(t => t.name === 'Standard Approval') || templates[0];
      if (defaultTemplate) {
        setSelectedWorkflow(defaultTemplate.id);
        setWorkflowSteps(defaultTemplate.steps);
        setCapex(prev => ({
          ...prev,
          workflowTemplate: defaultTemplate.id
        }));
      }
    };
    
    loadTemplates();
  }, []);

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
              onClick={() => navigate(`/properties/${id}/capex`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Capex Request</h1>
              <p className="text-sm text-pastel-gray mt-1">Create a new capital expenditure request</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <FileSpreadsheet size={18} />
            <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </div>

        {/* Form */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-pastel-gray mb-2">
            Select Budget Category
          </label>
          <select
            value={capex.selectedBudget}
            onChange={(e) => handleBudgetSelect(e.target.value)}
            className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve p-2.5"
          >
            <option value="">Select a budget category</option>
            {mockBudgets.map(budget => (
              <option key={budget.id} value={budget.id}>
                {budget.name} ({budget.code}) - Balance: AED {budget.summary.balance.toLocaleString()}
              </option>
            ))}
          </select>
          {formErrors.selectedBudget && (
            <p className="mt-1 text-xs text-red-500">{formErrors.selectedBudget}</p>
          )}
        </div>

        {selectedBudget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                  <DollarSign size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pastel-gray">Budget Provisioned</p>
                  <h3 className="text-2xl font-bold text-pastel-dusty">
                    AED {selectedBudget.summary.totalBudget.toLocaleString()}
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
                    AED {selectedBudget.summary.pendingTransfer.toLocaleString()}
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
                    AED {selectedBudget.summary.approvedTransfer.toLocaleString()}
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
                    AED {selectedBudget.summary.balance.toLocaleString()}
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
                    AED {selectedBudget.summary.proposalReceived.toLocaleString()}
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
                    AED {selectedBudget.summary.proposalApproved.toLocaleString()}
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
                    AED {selectedBudget.summary.balance.toLocaleString()}
                  </h3>
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${selectedBudget.summary.utilization}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-right text-pastel-gray">
                {selectedBudget.summary.utilization}% utilized
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
                    {selectedBudget.summary.utilization}%
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Reference ID
                </label>
                <input
                  type="text"
                  value={capex.referenceId}
                  readOnly
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 bg-pastel-peach bg-opacity-5 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Approved Budget Reference
                </label>
                <input
                  type="text"
                  value={capex.approvedBudgetReference}
                  readOnly
                  placeholder="Enter budget reference"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 bg-pastel-peach bg-opacity-5"
                />
                {formErrors.approvedBudgetReference && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.approvedBudgetReference}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={capex.projectName}
                onChange={(e) => setCapex(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="Enter project name"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.projectName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.projectName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Department
                </label>
                <select
                  value={capex.department}
                  onChange={(e) => {
                    setCapex(prev => ({ 
                      ...prev, 
                      department: e.target.value,
                      subDepartment: '' // Reset sub-department when department changes
                    }));
                  }}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {formErrors.department && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Sub Department
                </label>
                <select
                  value={capex.subDepartment}
                  onChange={(e) => setCapex(prev => ({ ...prev, subDepartment: e.target.value }))}
                  disabled={!capex.department}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select sub-department</option>
                  {capex.department && subDepartments[capex.department as keyof typeof subDepartments].map(subDept => (
                    <option key={subDept} value={subDept}>{subDept}</option>
                  ))}
                </select>
                {formErrors.subDepartment && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.subDepartment}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Project Lead
                </label>
                <input
                  type="text"
                  value={capex.projectLead}
                  onChange={(e) => setCapex(prev => ({ ...prev, projectLead: e.target.value }))}
                  placeholder="Enter project lead"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.projectLead && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.projectLead}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Design Consultant
                </label>
                <input
                  type="text"
                  value={capex.designConsultant}
                  onChange={(e) => setCapex(prev => ({ ...prev, designConsultant: e.target.value }))}
                  placeholder="Enter design consultant"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Main Contractor
                </label>
                <input
                  type="text"
                  value={capex.mainContractor}
                  onChange={(e) => setCapex(prev => ({ ...prev, mainContractor: e.target.value }))}
                  placeholder="Enter main contractor"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Description
              </label>
              <textarea
                value={capex.description}
                onChange={(e) => setCapex(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Enter project description"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Title/Area
                </label>
                <input
                  type="text"
                  value={capex.titleArea}
                  onChange={(e) => setCapex(prev => ({ ...prev, titleArea: e.target.value }))}
                  placeholder="Enter title or area"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.titleArea && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.titleArea}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Budget Provision ($)
                </label>
                <input
                  type="number"
                  value={capex.budgetProvision || ''}
                  onChange={(e) => setCapex(prev => ({ ...prev, budgetProvision: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter budget amount"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.budgetProvision && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.budgetProvision}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={capex.startDate}
                  onChange={(e) => setCapex(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.startDate && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={capex.endDate}
                  onChange={(e) => setCapex(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.endDate && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Remarks
              </label>
              <textarea
                value={capex.remarks}
                onChange={(e) => setCapex(prev => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                placeholder="Enter any additional remarks"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-2">
                Supporting Documents
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
                  <p className="text-xs text-pastel-gray mt-1">PDF, DOC, XLS up to 10MB</p>
                </label>
              </div>
              
              {capex.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {capex.documents.map((doc, index) => (
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

        {/* Workflow Section */}
        <div className="space-y-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
            <PredefinedWorkflows
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow.id);
                setWorkflowSteps(workflow.steps);
                setCapex(prev => ({
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

export default CapexNew;