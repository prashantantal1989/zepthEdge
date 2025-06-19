import { supabase } from '../lib/supabase';

export interface RFIUpdate {
  subject?: string;
  category?: string;
  question?: string;
  assignedTo?: string;
  dueDate?: string;
  status?: 'open' | 'pending' | 'answered' | 'closed';
  currentStep?: number;
}

export interface RFI {
  id: string;
  propertyId: string;
  subject: string;
  category: string;
  question: string;
  assignedTo?: string;
  dueDate: string;
  status: 'open' | 'pending' | 'answered' | 'closed';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadRFIs = async (
  propertyId: string,
  status?: 'open' | 'pending' | 'answered' | 'closed'
): Promise<RFI[]> => {
  let query = supabase
    .from('rfis')
    .select('*')
    .eq('property_id', propertyId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading RFIs:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    propertyId: row.property_id,
    subject: row.subject,
    category: row.category,
    question: row.question,
    assignedTo: row.assigned_to,
    dueDate: row.due_date,
    status: row.status,
    workflowId: row.workflow_id,
    currentStep: row.current_step,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  }));
};

export const createRFI = async (
  rfi: Omit<RFI, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<RFI | null> => {
  const { data, error } = await supabase
    .from('rfis')
    .insert([{
      property_id: rfi.propertyId,
      subject: rfi.subject,
      category: rfi.category,
      question: rfi.question,
      assigned_to: rfi.assignedTo,
      due_date: rfi.dueDate,
      status: rfi.status,
      workflow_id: rfi.workflowId,
      current_step: rfi.currentStep,
      created_by: supabase.auth.user()?.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating RFI:', error);
    return null;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    subject: data.subject,
    category: data.category,
    question: data.question,
    assignedTo: data.assigned_to,
    dueDate: data.due_date,
    status: data.status,
    workflowId: data.workflow_id,
    currentStep: data.current_step,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by
  };
};

export const updateRFI = async (
  id: string,
  updates: RFIUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('rfis')
    .update({
      subject: updates.subject,
      category: updates.category,
      question: updates.question,
      assigned_to: updates.assignedTo,
      due_date: updates.dueDate,
      status: updates.status,
      current_step: updates.currentStep,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating RFI:', error);
    return false;
  }

  return true;
};

export const deleteRFI = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('rfis')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting RFI:', error);
    return false;
  }

  return true;
};