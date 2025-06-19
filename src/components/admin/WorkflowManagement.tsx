import { useState } from 'react';
import { 
  Plus, Edit2, Trash2, ChevronRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkflow } from '../../contexts/WorkflowContext';
import WorkflowFormModal from './WorkflowFormModal';
import { WorkflowTemplate } from '../../types/settings';

const WorkflowManagement = () => {
  const { templates, loading, error, deleteTemplate } = useWorkflow();
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowTemplate | null>(null);

  const handleEdit = (workflow: WorkflowTemplate) => {
    setEditingWorkflow(workflow);
    setShowWorkflowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow template?')) {
      await deleteTemplate(id);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
        <h3 className="text-lg font-medium">Error Loading Workflow Templates</h3>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Workflow Templates</h3>
          <button
            onClick={() => {
              setEditingWorkflow(null);
              setShowWorkflowModal(true);
            }}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-primary-700"
          >
            <Plus size={16} />
            Add Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={36} className="animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {templates.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No workflow templates found.</p>
              <button
                onClick={() => {
                  setEditingWorkflow(null);
                  setShowWorkflowModal(true);
                }}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg inline-flex items-center gap-2 hover:bg-primary-700"
              >
                <Plus size={16} />
                Create First Template
              </button>
            </div>
          ) : (
            templates.map((workflow) => (
              <motion.div
                key={workflow.id}
                variants={itemVariants}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
                  <p className="text-sm text-gray-500">{workflow.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {workflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <span className="text-xs text-gray-500">{step.role}</span>
                        {index < workflow.steps.length - 1 && (
                          <ChevronRight size={12} className="text-gray-400 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(workflow)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <WorkflowFormModal
        isOpen={showWorkflowModal}
        onClose={() => setShowWorkflowModal(false)}
        onSave={(workflow) => {
          // This is handled by the WorkflowContext
          setShowWorkflowModal(false);
        }}
        workflow={editingWorkflow}
      />
    </motion.div>
  );
};

export default WorkflowManagement;