import { request } from '../lib/apiClient';
import {
  WorkflowTemplate,
  WorkflowInstance,
  // WorkflowStep, // Step structure is mostly handled by backend or part of WorkflowInstance.steps_data
  EntityType,
  // WorkflowStatus // Status strings like 'active', 'completed' are used directly
} from '../types/workflow'; // Adjusted path if types/workflow.ts is the correct location
// import { WorkflowTemplate as SettingsWorkflowTemplate } from '../types/settings'; // If WorkflowTemplate from settings is different

// Base shapes for what the backend API might return/accept.
// These should align with your backend's DTOs or database models.

interface BackendWorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  steps: any[]; // Define step structure if needed, e.g., { name: string; approver_role: string; ... }
  created_at?: string;
  updated_at?: string;
  created_by?: string; // Assuming UUID string
  updated_by?: string; // Assuming UUID string
}

interface BackendWorkflowInstance {
  id: string;
  template_id: string;
  entity_type: EntityType;
  entity_id: string;
  status: string; // e.g., 'active', 'completed', 'rejected'
  current_step: number;
  steps_data: any[]; // Array of step objects with their current states
  created_at?: string;
  updated_at?: string;
  created_by?: string; // Assuming UUID string
  updated_by?: string; // Assuming UUID string
}

// Helper to map backend template to frontend template if needed
// For now, assuming types are largely compatible or frontend type will be adjusted.
// The frontend WorkflowTemplate from types/workflow.ts might have `createdAt` instead of `created_at`.
const mapToFrontendTemplate = (bt: BackendWorkflowTemplate): WorkflowTemplate => ({
  id: bt.id,
  name: bt.name,
  description: bt.description || '',
  category: bt.category || '',
  steps: bt.steps,
  // Mapping audit fields if they exist on Frontend type
  createdAt: bt.created_at || new Date().toISOString(),
  updatedAt: bt.updated_at || new Date().toISOString(),
  // createdBy and updatedBy might be user objects or just IDs on the frontend type
  // For now, assuming they are not complex objects on WorkflowTemplate type
});

const mapToFrontendInstance = (bi: BackendWorkflowInstance): WorkflowInstance => ({
  id: bi.id,
  templateId: bi.template_id,
  entityType: bi.entity_type,
  entityId: bi.entity_id,
  status: bi.status,
  currentStep: bi.current_step,
  steps: bi.steps_data, // Assuming frontend type uses 'steps' for 'steps_data'
  // Mapping audit fields
  createdAt: bi.created_at || new Date().toISOString(),
  updatedAt: bi.updated_at || new Date().toISOString(),
  // createdBy/updatedBy if needed on frontend type
});


export class WorkflowService {
  // Workflow Template Methods
  static async getAllTemplates(): Promise<WorkflowTemplate[]> {
    try {
      const data = await request<BackendWorkflowTemplate[]>('/api/workflow-templates', { method: 'GET' });
      return data.map(mapToFrontendTemplate);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      throw error;
    }
  }

  static async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    try {
      const data = await request<BackendWorkflowTemplate>(`/api/workflow-templates/${id}`, { method: 'GET' });
      if (!data) return null;
      return mapToFrontendTemplate(data);
    } catch (error: any) {
      if (error.status === 404) return null;
      console.error(`Error fetching workflow template by ID ${id}:`, error);
      throw error;
    }
  }

  static async createTemplate(
    templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ): Promise<WorkflowTemplate> { // Return type is frontend type
    try {
      const payload = { // This is what backend POST /api/workflow-templates expects
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        steps: templateData.steps,
      };
      const data = await request<BackendWorkflowTemplate>('/api/workflow-templates', {
        method: 'POST',
        body: payload,
      });
      return mapToFrontendTemplate(data);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      throw error;
    }
  }

  static async updateTemplate(id: string, templateData: Partial<Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<WorkflowTemplate> {
     try {
      const payload = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        steps: templateData.steps,
      };
      const data = await request<BackendWorkflowTemplate>(`/api/workflow-templates/${id}`, {
        method: 'PUT',
        body: payload,
      });
      return mapToFrontendTemplate(data);
    } catch (error) {
      console.error(`Error updating workflow template ${id}:`, error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      await request<void>(`/api/workflow-templates/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting workflow template ${id}:`, error);
      throw error;
    }
  }

  // Workflow Instance Methods
  static async createWorkflowInstance(
    templateId: string,
    entityType: EntityType,
    entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>
  ): Promise<WorkflowInstance> {
    try {
      // Backend POST /api/workflows expects: { templateId, entityType, entityId, context? }
      const payload = { templateId, entityType, entityId, context };
      const data = await request<BackendWorkflowInstance>('/api/workflows', {
        method: 'POST',
        body: payload,
      });
      return mapToFrontendInstance(data);
    } catch (error) {
      console.error('Error creating workflow instance:', error);
      throw error;
    }
  }

  static async getWorkflowInstance(id: string): Promise<WorkflowInstance | null> {
     try {
      const data = await request<BackendWorkflowInstance>(`/api/workflows/${id}`, { method: 'GET' });
      if (!data) return null;
      return mapToFrontendInstance(data);
    } catch (error: any) {
      if (error.status === 404) return null;
      console.error(`Error fetching workflow instance by ID ${id}:`, error);
      throw error;
    }
  }
  
  // getWorkflowInstancesByEntity might require a specific backend endpoint like GET /api/workflows?entityType=X&entityId=Y
  // This was not explicitly part of the backend subtask, so commenting out unless the endpoint exists.
  // static async getWorkflowInstancesByEntity(entityType: EntityType, entityId: string): Promise<WorkflowInstance[]> {
  //   try {
  //     const data = await request<BackendWorkflowInstance[]>(`/api/workflows?entityType=${entityType}&entityId=${entityId}`);
  //     return data.map(mapToFrontendInstance);
  //   } catch (error) {
  //     console.error(`Error fetching workflow instances for entity ${entityType}/${entityId}:`, error);
  //     throw error;
  //   }
  // }


  static async advanceWorkflowStep(
    workflowInstanceId: string,
    stepIndex: number,
    decision: 'approved' | 'rejected',
    comment?: string
  ): Promise<WorkflowInstance> {
    try {
      // Backend PATCH /api/workflows/:workflowId/steps/:stepIndex expects: { status, comment? }
      const payload = { status: decision, comment };
      const data = await request<BackendWorkflowInstance>(
        `/api/workflows/${workflowInstanceId}/steps/${stepIndex}`,
        {
          method: 'PATCH',
          body: payload,
        }
      );
      return mapToFrontendInstance(data);
    } catch (error) {
      console.error(`Error advancing workflow step for instance ${workflowInstanceId}, step ${stepIndex}:`, error);
      throw error;
    }
  }

  // The updateEntityStatus logic is now fully handled by the backend.
  // This method is removed from the frontend service.
}