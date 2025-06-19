import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkflowTemplate } from '../types/settings';
import { WorkflowService } from '../services/workflowService';

interface WorkflowContextType {
  templates: WorkflowTemplate[];
  loading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<WorkflowTemplate | null>;
  createTemplate: (template: Omit<WorkflowTemplate, 'id'>) => Promise<WorkflowTemplate | null>;
  updateTemplate: (id: string, template: Omit<WorkflowTemplate, 'id'>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  createWorkflowInstance: (templateId: string, entityType: string, entityId: string) => Promise<string | null>;
  updateWorkflowStep: (workflowId: string, stepIndex: number, status: 'pending' | 'approved' | 'rejected', comment?: string) => Promise<boolean>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: ReactNode;
}

export const WorkflowProvider = ({ children }: WorkflowProviderProps) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkflowService.getAllTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error loading workflow templates:', err);
      setError('Failed to load workflow templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const getTemplate = async (id: string): Promise<WorkflowTemplate | null> => {
    try {
      return await WorkflowService.getTemplateById(id);
    } catch (err) {
      console.error('Error getting workflow template:', err);
      setError('Failed to get workflow template');
      return null;
    }
  };

  const createTemplate = async (
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<WorkflowTemplate | null> => {
    try {
      const newTemplate = await WorkflowService.createTemplate(template);
      if (newTemplate) {
        await refreshTemplates();
      }
      return newTemplate;
    } catch (err) {
      console.error('Error creating workflow template:', err);
      setError('Failed to create workflow template');
      return null;
    }
  };

  const updateTemplate = async (
    id: string,
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<boolean> => {
    try {
      const success = await WorkflowService.updateTemplate(id, template);
      if (success) {
        await refreshTemplates();
      }
      return success;
    } catch (err) {
      console.error('Error updating workflow template:', err);
      setError('Failed to update workflow template');
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const success = await WorkflowService.deleteTemplate(id);
      if (success) {
        await refreshTemplates();
      }
      return success;
    } catch (err) {
      console.error('Error deleting workflow template:', err);
      setError('Failed to delete workflow template');
      return false;
    }
  };

  const createWorkflowInstance = async (
    templateId: string,
    entityType: string,
    entityId: string
  ): Promise<string | null> => {
    try {
      return await WorkflowService.createWorkflowInstance(templateId, entityType, entityId);
    } catch (err) {
      console.error('Error creating workflow instance:', err);
      setError('Failed to create workflow instance');
      return null;
    }
  };

  const updateWorkflowStep = async (
    workflowId: string,
    stepIndex: number,
    status: 'pending' | 'approved' | 'rejected',
    comment?: string
  ): Promise<boolean> => {
    try {
      return await WorkflowService.updateWorkflowStep(workflowId, stepIndex, status, comment);
    } catch (err) {
      console.error('Error updating workflow step:', err);
      setError('Failed to update workflow step');
      return false;
    }
  };

  const value = {
    templates,
    loading,
    error,
    refreshTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createWorkflowInstance,
    updateWorkflowStep
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};