import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { loadSettings } from '../../utils/settings';
import { WorkflowTemplate } from '../../types/settings';

interface PredefinedWorkflowsProps {
  onSelect: (workflow: WorkflowTemplate) => void;
  selectedId: string | null;
}

const PredefinedWorkflows = ({ onSelect, selectedId }: PredefinedWorkflowsProps) => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);

  useEffect(() => {
    const settings = loadSettings();
    setWorkflows(settings.workflowTemplates);
  }, []);

  return (
    <div>
      <h3 className="text-sm font-medium text-pastel-gray mb-3">Approval Workflow Template</h3>
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <motion.div
            key={workflow.id}
            whileHover={{ scale: 1.01 }}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedId === workflow.id
                ? 'border-pastel-mauve bg-pastel-pink bg-opacity-5'
                : 'border-pastel-pink border-opacity-20 hover:border-pastel-mauve'
            }`}
            onClick={() => onSelect(workflow)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-pastel-dusty">{workflow.name}</h4>
                <p className="text-xs text-pastel-gray mt-1">{workflow.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <span className="text-xs text-pastel-gray">{step.role}</span>
                      {index < workflow.steps.length - 1 && (
                        <span className="mx-1 text-pastel-gray">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {selectedId === workflow.id && (
                <CheckCircle2 size={16} className="text-pastel-mauve" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PredefinedWorkflows;