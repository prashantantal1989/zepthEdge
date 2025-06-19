import { WorkflowTemplate } from '../types/settings';
import { supabase } from '../lib/supabase';
import { loadWorkflowTemplates } from '../utils/workflowTemplates';
import { createWorkflowTemplate, updateWorkflowTemplate, deleteWorkflowTemplate } from '../utils/workflowTemplates';

/**
 * Workflow Service
 * 
 * This service provides methods for managing workflow templates in the application.
 */
export class WorkflowService {
  /**
   * Get all workflow templates
   */
  static async getAllTemplates(): Promise<WorkflowTemplate[]> {
    return loadWorkflowTemplates();
  }

  /**
   * Create a new workflow template
   */
  static async createTemplate(
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<WorkflowTemplate | null> {
    return createWorkflowTemplate(template);
  }

  /**
   * Update a workflow template
   */
  static async updateTemplate(
    id: string,
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<boolean> {
    return updateWorkflowTemplate(id, template);
  }

  /**
   * Delete a workflow template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    return deleteWorkflowTemplate(id);
  }

  /**
   * Get a workflow template by ID
   */
  static async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    const templates = await loadWorkflowTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Create a workflow instance from a template
   */
  static async createWorkflowInstance(
    templateId: string,
    entityType: string,
    entityId: string
  ): Promise<string | null> {
    // In development mode, return a mock workflow ID
    if (import.meta.env.DEV) {
      return crypto.randomUUID();
    }
    
    try {
      // Get the template to copy its steps
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Initialize steps_data with steps from the template
      const stepsData = template.steps.map(step => ({
        ...step,
        status: 'waiting',
        updated_at: null,
        updated_by: null,
        comment: null
      }));
      
      // Set the first step to pending
      if (stepsData.length > 0) {
        stepsData[0].status = 'pending';
      }
      
      // Create workflow instance in Supabase
      const { data, error } = await supabase
        .from('workflows')
        .insert([{
          template_id: templateId,
          entity_type: entityType,
          entity_id: entityId,
          status: 'active',
          current_step: 0,
          steps_data: stepsData
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating workflow instance:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createWorkflowInstance:', error);
      return null;
    }
  }

  /**
   * Update a workflow step
   */
  static async updateWorkflowStep(
    workflowId: string,
    stepIndex: number,
    status: 'pending' | 'approved' | 'rejected',
    comment?: string
  ): Promise<boolean> {
    try {
      // Get the workflow
      const { data: workflow, error: getError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (getError) {
        console.error('Error getting workflow:', getError);
        return false;
      }

      // Update the workflow step
      const stepsData = workflow.steps_data as any[];
      if (stepIndex >= 0 && stepIndex < stepsData.length) {
        stepsData[stepIndex].status = status;
        stepsData[stepIndex].updated_at = new Date().toISOString();
        stepsData[stepIndex].updated_by = (await supabase.auth.getUser()).data.user?.id;
        
        if (comment) {
          stepsData[stepIndex].comment = comment;
        }

        // Determine the new workflow status and current step
        let newStatus = workflow.status;
        let newCurrentStep = workflow.current_step;
        
        if (status === 'approved') {
          // Move to the next step if available
          if (stepIndex + 1 < stepsData.length) {
            newCurrentStep = stepIndex + 1;
            stepsData[stepIndex + 1].status = 'pending';
          } else {
            // All steps approved, mark workflow as completed
            newStatus = 'completed';
          }
        } else if (status === 'rejected') {
          // Workflow is rejected
          newStatus = 'rejected';
        }

        // Update the entity status based on workflow status
        await this.updateEntityStatus(workflow.entity_type, workflow.entity_id, 
          newStatus === 'completed' ? 'approved' : 
          newStatus === 'rejected' ? 'rejected' : 'pending');

        // Update the workflow
        const { error: updateError } = await supabase
          .from('workflows')
          .update({
            steps_data: stepsData,
            current_step: newCurrentStep,
            status: newStatus,
            updated_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', workflowId);

        if (updateError) {
          console.error('Error updating workflow step:', updateError);
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in updateWorkflowStep:', error);
      return false;
    }
  }
  
  /**
   * Get a workflow instance by ID
   */
  static async getWorkflowInstance(id: string): Promise<any | null> {
    // In development mode, return a mock workflow
    if (import.meta.env.DEV) {
      return {
        id,
        status: 'active',
        current_step: 0,
        steps_data: []
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting workflow instance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWorkflowInstance:', error);
      return null;
    }
  }
  
  /**
   * Helper function to update the status of the entity associated with a workflow
   */
  private static async updateEntityStatus(
    entityType: string,
    entityId: string,
    status: 'draft' | 'pending' | 'approved' | 'rejected'
  ): Promise<boolean> {
    try {
      let table: string;
      let mappedStatus = status;
      
      switch (entityType) {
        case 'budget_request':
          table = 'budget_requests';
          break;
        case 'capex_request':
          table = 'capex_requests';
          break;
        case 'asset_disposal':
          table = 'asset_disposals';
          break;
        case 'budget_transfer':
          table = 'budget_transfers';
          break;
        case 'rfi':
          table = 'rfis';
          // Map status for RFIs
          mappedStatus = status === 'approved' ? 'answered' : 
                  status === 'rejected' ? 'closed' : 
                  status === 'pending' ? 'pending' : 'open';
          break;
        case 'submittal':
          table = 'submittals';
          break;
        case 'transmittal':
          table = 'transmittals';
          // Map status for transmittals
          mappedStatus = status === 'approved' ? 'acknowledged' : 
                  status === 'rejected' ? 'draft' : 
                  status === 'pending' ? 'pending' : 'sent';
          break;
        default:
          console.error(`Unknown entity type: ${entityType}`);
          return false;
      }
      
      const { error } = await supabase
        .from(table)
        .update({ status: mappedStatus })
        .eq('id', entityId);
      
      if (error) {
        console.error(`Error updating ${entityType} status:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateEntityStatus:', error);
      return false;
    }
  }
}