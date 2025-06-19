import { supabase } from '../lib/supabase';
import { WorkflowTemplate, WorkflowStep } from '../types/settings';
import { loadSettings, saveSettings } from './settings';

/**
 * Load workflow templates from Supabase
 */
export const loadWorkflowTemplates = async (): Promise<WorkflowTemplate[]> => {
  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('workflow_templates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading workflow templates:', error);
    // Fallback to local storage if Supabase fails
    const settings = loadSettings();
    return settings.workflowTemplates;
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    steps: row.steps as unknown as WorkflowStep[]
  }));
};

/**
 * Create a new workflow template
 */
export const createWorkflowTemplate = async (
  template: Omit<WorkflowTemplate, 'id'>
): Promise<WorkflowTemplate | null> => {
  // In production, insert into Supabase
  const { data, error } = await supabase
    .from('workflow_templates')
    .insert([{
      name: template.name,
      description: template.description,
      steps: template.steps as unknown as Json,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow template:', error);
    // Fallback to local storage if Supabase fails
    const settings = loadSettings();
    const newTemplate = {
      ...template,
      id: crypto.randomUUID()
    };
    settings.workflowTemplates.push(newTemplate);
    saveSettings(settings);
    return newTemplate;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    steps: data.steps as unknown as WorkflowStep[]
  };
};

/**
 * Update a workflow template
 */
export const updateWorkflowTemplate = async (
  id: string,
  template: Omit<WorkflowTemplate, 'id'>
): Promise<boolean> => {
  // In production, update in Supabase
  const { error } = await supabase
    .from('workflow_templates')
    .update({
      name: template.name,
      description: template.description,
      steps: template.steps as unknown as Json,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating workflow template:', error);
    // Fallback to local storage if Supabase fails
    const settings = loadSettings();
    const index = settings.workflowTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      settings.workflowTemplates[index] = {
        ...template,
        id
      };
      saveSettings(settings);
      return true;
    }
    return false;
  }

  return true;
};

/**
 * Delete a workflow template
 */
export const deleteWorkflowTemplate = async (id: string): Promise<boolean> => {
  // In production, delete from Supabase
  const { error } = await supabase
    .from('workflow_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting workflow template:', error);
    // Fallback to local storage if Supabase fails
    const settings = loadSettings();
    settings.workflowTemplates = settings.workflowTemplates.filter(t => t.id !== id);
    saveSettings(settings);
    return true;
  }

  return true;
};