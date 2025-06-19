import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, X, Plus,
  Calendar, User, PackageOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import PredefinedWorkflows from '../components/workflow/PredefinedWorkflows';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import { createTransmittal } from '../utils/transmittals';
import { uploadDocument } from '../utils/documents';
import { WorkflowService } from '../services/workflowService';
import { WorkflowTemplate } from '../types/settings';

interface TransmittalForm {
  subject: string;
  recipients: string[];
  dueDate: string;
  notes: string;
  documents: File[];
}

const TransmittalNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  
  const [transmittal, setTransmittal] = useState<TransmittalForm>({
    subject: '',
    recipients: [],
    dueDate: '',
    notes: '',
    documents: []
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!transmittal.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    if (transmittal.recipients.length === 0) {
      errors.recipients = 'At least one recipient is required';
    }
    if (!transmittal.dueDate) {
      errors.dueDate = 'Due date is required';
    }
    if (transmittal.documents.length === 0) {
      errors.documents = 'At least one document is required';
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
      // Create the transmittal
      const newTransmittal = await createTransmittal({
        propertyId: id,
        subject: transmittal.subject,
        recipients: transmittal.recipients,
        dueDate: transmittal.dueDate,
        notes: transmittal.notes,
        status: 'draft',
        workflowId: '', // This will be updated after creating the workflow
        currentStep: 0
      });
      
      if (!newTransmittal) {
        throw new Error('Failed to create transmittal');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'transmittal',
          newTransmittal.id
        );
        
        if (workflowId) {
          // Update the transmittal with the workflow ID
          await supabase
            .from('transmittals')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newTransmittal.id);
        }
      }
      
      // Upload documents
      for (const file of transmittal.documents) {
        await uploadDocument(id, file, 'transmittal', {
          transmittalId: newTransmittal.id
        });
      }

      // Navigate back to the transmittal list
      navigate(`/properties/${id}/collab/transmittal`);
    } catch (error) {
      console.error('Error creating transmittal:', error);
      alert('Failed to create transmittal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setTransmittal(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setTransmittal(prev => ({
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
        setWorkflowSteps(defaultTemplate.steps);
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
              onClick={() => navigate(`/properties/${id}/collab/transmittal`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Transmittal</h1>
              <p className="text-sm text-pastel-gray mt-1">Create a new document transmittal</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <PackageOpen size={18} />
            <span>{isSubmitting ? 'Sending...' : 'Send Transmittal'}</span>
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
                value={transmittal.subject}
                onChange={(e) => setTransmittal(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter transmittal subject"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.subject && (
                <p className="mt-1 text-xs text-red-500">{formErrors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Recipients
              </label>
              <input
                type="text"
                value={transmittal.recipients.join(', ')}
                onChange={(e) => setTransmittal(prev => ({ 
                  ...prev, 
                  recipients: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                }))}
                placeholder="Enter recipient names or emails (comma-separated)"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.recipients && (
                <p className="mt-1 text-xs text-red-500">{formErrors.recipients}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={transmittal.dueDate}
                onChange={(e) => setTransmittal(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.dueDate && (
                <p className="mt-1 text-xs text-red-500">{formErrors.dueDate}</p>
              )}
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
                <p className="mt-2 text-xs text-red-500">{formErrors.workflow}</p>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
              <WorkflowBuilder
                steps={workflowSteps}
                onStepsChange={setWorkflowSteps}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Notes
              </label>
              <textarea
                value={transmittal.notes}
                onChange={(e) => setTransmittal(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Add any additional notes or instructions"
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
                  <p className="text-xs text-pastel-gray mt-1">PDF, DOC, XLS up to 10MB</p>
                </label>
              </div>
              
              {transmittal.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {transmittal.documents.map((doc, index) => (
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
              {formErrors.documents && (
                <p className="mt-1 text-xs text-red-500">{formErrors.documents}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransmittalNew;