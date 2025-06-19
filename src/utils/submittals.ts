import { supabase } from '../lib/supabase';

// Mock data for development
const mockSubmittals: Submittal[] = [
  {
    id: 'u0v1w2x3-y4z5-6a7b-8c9d-e0f1g2h3i4j5',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    title: 'Lobby Furniture Samples',
    category: 'Furniture',
    description: 'Samples of proposed furniture for the lobby renovation',
    status: 'pending',
    workflowId: 'd0e1f2g3-h4i5-6j7k-8l9m-0n1o2p3q4r5',
    currentStep: 1,
    createdAt: '2024-03-15T11:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-03-15T11:30:00Z'
  },
  {
    id: 'v1w2x3y4-z5a6-7b8c-9d0e-f1g2h3i4j5k6',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    title: 'HVAC System Specifications',
    category: 'Engineering',
    description: 'Technical specifications for the new HVAC system',
    status: 'approved',
    workflowId: 'e1f2g3h4-i5j6-7k8l-9m0n-1o2p3q4r5s6',
    currentStep: 3,
    createdAt: '2024-02-20T14:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-02-25T09:30:00Z'
  }
];

export interface SubmittalUpdate {
  title?: string;
  category?: string;
  description?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  currentStep?: number;
}

export interface Submittal {
  id: string;
  propertyId: string;
  title: string;
  category: string;
  description?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadSubmittals = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
): Promise<Submittal[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredSubmittals = mockSubmittals.filter(submittal => submittal.propertyId === propertyId);
      
      if (status) {
        filteredSubmittals = filteredSubmittals.filter(submittal => submittal.status === status);
      }
      
      return filteredSubmittals;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('submittals')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading submittals:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      title: row.title,
      category: row.category,
      description: row.description,
      status: row.status,
      workflowId: row.workflow_id,
      currentStep: row.current_step,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading submittals:', error);
    return [];
  }
};

export const createSubmittal = async (
  submittal: Omit<Submittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Submittal | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newSubmittal: Submittal = {
        ...submittal,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockSubmittals.push(newSubmittal);
      return newSubmittal;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('submittals')
      .insert([{
        property_id: submittal.propertyId,
        title: submittal.title,
        category: submittal.category,
        description: submittal.description,
        status: submittal.status,
        workflow_id: submittal.workflowId,
        current_step: submittal.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating submittal:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      title: data.title,
      category: data.category,
      description: data.description,
      status: data.status,
      workflowId: data.workflow_id,
      currentStep: data.current_step,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating submittal:', error);
    return null;
  }
};

export const updateSubmittal = async (
  id: string,
  updates: SubmittalUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('submittals')
    .update({
      title: updates.title,
      category: updates.category,
      description: updates.description,
      status: updates.status,
      current_step: updates.currentStep,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating submittal:', error);
    return false;
  }

  return true;
};

export const deleteSubmittal = async (id: string): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const initialLength = mockSubmittals.length;
      mockSubmittals = mockSubmittals.filter(submittal => submittal.id !== id);
      return mockSubmittals.length < initialLength;
    }
    
    // In production, delete from Supabase
    const { error } = await supabase
      .from('submittals')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Error deleting submittal:', error);
      return false;
    }
  
    return true;
  } catch (error) {
    console.error('Error deleting submittal:', error);
    return false;
  }
};