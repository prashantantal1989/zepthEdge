import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, X, Plus,
  Calendar, User, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createRFI } from '../utils/rfis';
import { uploadDocument } from '../utils/documents';
import { loadWorkflowTemplates } from '../utils/workflowTemplates';
import { WorkflowService } from '../services/workflowService';

interface RFIForm {
  subject: string;
  category: string;
  question: string;
  assignedTo: string;
  dueDate: string;
  documents: File[];
}

const categories = [
  'Technical',
  'Design',
  'Safety',
  'Operations',
  'Maintenance',
  'IT',
  'Other'
];

const RFINew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  
  const [rfi, setRFI] = useState<RFIForm>({
    subject: '',
    category: '',
    question: '',
    assignedTo: '',
    dueDate: '',
    documents: []
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!rfi.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    if (!rfi.category) {
      errors.category = 'Category is required';
    }
    if (!rfi.question.trim()) {
      errors.question = 'Question is required';
    }
    if (!rfi.assignedTo.trim()) {
      errors.assignedTo = 'Assignee is required';
    }
    if (!rfi.dueDate) {
      errors.dueDate = 'Due date is required';
    }
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
    
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the RFI
      const newRFI = await createRFI({
        propertyId: id,
        subject: rfi.subject,
        category: rfi.category,
        question: rfi.question,
        assignedTo: rfi.assignedTo,
        dueDate: rfi.dueDate,
        status: 'open',
        workflowId: '', // This will be updated after creating the workflow
        currentStep: 0
      });
      
      if (!newRFI) {
        throw new Error('Failed to create RFI');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'rfi',
          newRFI.id
        );
        
        if (workflowId) {
          // Update the RFI with the workflow ID
          await supabase
            .from('rfis')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newRFI.id);
        }
      }
      
      // Upload documents
      for (const file of rfi.documents) {
        await uploadDocument(id, file, 'rfi', {
          rfiId: newRFI.id
        });
      }

      // Navigate back to the RFI list
      navigate(`/properties/${id}/collab/rfi`);
    } catch (error) {
      console.error('Error creating RFI:', error);
      alert('Failed to create RFI. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setRFI(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setRFI(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    // Load workflow templates and select the default one
    const loadTemplates = async () => {
      const templates = await loadWorkflowTemplates();
      const defaultTemplate = templates.find(t => t.name === 'Simple Approval') || templates[0];
      if (defaultTemplate) {
        setSelectedWorkflow(defaultTemplate.id);
      }
    };
    
    loadTemplates();
  }, []);

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/properties/${id}/collab/rfi`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New RFI</h1>
              <p className="text-sm text-pastel-gray mt-1">Create a new Request for Information</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <MessageSquare size={18} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit RFI'}</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Subject
              </label>
              <input
                type="text"
                value={rfi.subject}
                onChange={(e) => setRFI(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter RFI subject"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.subject && (
                <p className="mt-1 text-xs text-red-500">{formErrors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Category
              </label>
              <select
                value={rfi.category}
                onChange={(e) => setRFI(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Question
              </label>
              <textarea
                value={rfi.question}
                onChange={(e) => setRFI(prev => ({ ...prev, question: e.target.value }))}
                rows={4}
                placeholder="Enter your question or request for information"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.question && (
                <p className="mt-1 text-xs text-red-500">{formErrors.question}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={rfi.assignedTo}
                  onChange={(e) => setRFI(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Enter assignee name"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.assignedTo && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.assignedTo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={rfi.dueDate}
                  onChange={(e) => setRFI(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.dueDate && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Workflow Selection */}
            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Approval Workflow
              </label>
              <select
                value={selectedWorkflow || ''}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              >
                <option value="">Select a workflow template</option>
                <option value="simple">Simple Approval</option>
                <option value="standard">Standard Approval</option>
              </select>
              {formErrors.workflow && (
                <p className="mt-1 text-xs text-red-500">{formErrors.workflow}</p>
              )}
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
              
              {rfi.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {rfi.documents.map((doc, index) => (
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

export default RFINew;