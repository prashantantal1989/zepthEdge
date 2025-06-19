import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import { WorkflowTemplate, WorkflowStep } from '../../types/settings';
import { useWorkflow } from '../../contexts/WorkflowContext';

interface WorkflowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: WorkflowTemplate) => void; // This is still needed for the UI flow
  workflow?: WorkflowTemplate | null;
}

const WorkflowFormModal = ({ isOpen, onClose, onSave, workflow }: WorkflowFormModalProps) => {
  const { createTemplate, updateTemplate } = useWorkflow();
  const [formData, setFormData] = useState<WorkflowTemplate>({
    id: '',
    name: '',
    description: '',
    steps: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workflow) {
      setFormData(workflow);
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        steps: []
      });
    }
  }, [workflow]);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type: 'approval',
      role: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (id: string, field: keyof WorkflowStep, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === id ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (id: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const saveWorkflow = async () => {
      try {
        if (workflow) {
          // Update existing workflow
          const success = await updateTemplate(workflow.id, {
            name: formData.name,
            description: formData.description,
            steps: formData.steps
          });
          
          if (success) {
            onSave({
              ...formData,
              id: workflow.id
            });
          }
        } else {
          // Create new workflow
          const newWorkflow = await createTemplate({
            name: formData.name,
            description: formData.description,
            steps: formData.steps
          });
          
          if (newWorkflow) {
            onSave(newWorkflow);
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    };
    
    saveWorkflow();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {workflow ? 'Edit' : 'New'} Workflow Template
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter template description"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Approval Steps
                    </label>
                    <button
                      type="button"
                      onClick={addStep}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Step
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-500">Step {index + 1}</span>
                        </div>

                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={step.role}
                            onChange={(e) => updateStep(step.id, 'role', e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Enter approver role"
                          />
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Enter step description"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {formData.steps.length === 0 && (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No steps added yet. Click "Add Step" to start building your workflow.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : workflow ? 'Save Changes' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkflowFormModal;