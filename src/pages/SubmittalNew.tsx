import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, X, Plus,
  Calendar, User, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createSubmittal } from '../utils/submittals';
import { uploadDocument } from '../utils/documents';
import { WorkflowService } from '../services/workflowService';
import { loadWorkflowTemplates } from '../utils/workflowTemplates';

interface SubmittalForm {
  title: string;
  category: string;
  description: string;
  documents: File[];
}

const categories = [
  'Design',
  'Equipment',
  'Furniture',
  'IT',
  'Policies',
  'Procedures',
  'Safety',
  'Training',
  'Uniforms',
  'Other'
];

const SubmittalNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  
  const [submittal, setSubmittal] = useState<SubmittalForm>({
    title: '',
    category: '',
    description: '',
    documents: []
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!submittal.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!submittal.category) {
      errors.category = 'Category is required';
    }
    if (!submittal.description.trim()) {
      errors.description = 'Description is required';
    }
    if (submittal.documents.length === 0) {
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
      // Create the submittal
      const newSubmittal = await createSubmittal({
        propertyId: id,
        title: submittal.title,
        category: submittal.category,
        description: submittal.description,
        status: 'draft',
        workflowId: '', // This will be updated after creating the workflow
        currentStep: 0
      });
      
      if (!newSubmittal) {
        throw new Error('Failed to create submittal');
      }
      
      // Create workflow instance
      if (selectedWorkflow) {
        const workflowId = await WorkflowService.createWorkflowInstance(
          selectedWorkflow,
          'submittal',
          newSubmittal.id
        );
        
        if (workflowId) {
          // Update the submittal with the workflow ID
          await supabase
            .from('submittals')
            .update({ 
              workflow_id: workflowId,
              status: 'pending'
            })
            .eq('id', newSubmittal.id);
        }
      }
      
      // Upload documents
      for (const file of submittal.documents) {
        await uploadDocument(id, file, 'submittal', {
          submittalId: newSubmittal.id
        });
      }

      // Navigate back to the submittal list
      navigate(`/properties/${id}/collab/submittals`);
    } catch (error) {
      console.error('Error creating submittal:', error);
      alert('Failed to create submittal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setSubmittal(prev => ({
      ...prev,
      documents: [...prev.documents, ...Array.from(files)]
    }));
  };

  const removeFile = (index: number) => {
    setSubmittal(prev => ({
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
              onClick={() => navigate(`/properties/${id}/collab/submittals`)}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Submittal</h1>
              <p className="text-sm text-pastel-gray mt-1">Create a new submittal for approval</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <ClipboardList size={18} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Title
              </label>
              <input
                type="text"
                value={submittal.title}
                onChange={(e) => setSubmittal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter submittal title"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Category
              </label>
              <select
                value={submittal.category}
                onChange={(e) => setSubmittal(prev => ({ ...prev, category: e.target.value }))}
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
                Description
              </label>
              <textarea
                value={submittal.description}
                onChange={(e) => setSubmittal(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Describe the submittal and any special requirements"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>
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
              
              {submittal.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {submittal.documents.map((doc, index) => (
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

export default SubmittalNew;