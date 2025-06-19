import { supabase } from '../lib/supabase';

// Mock data for development
const mockTransmittals: Transmittal[] = [
  {
    id: 's8t9u0v1-w2x3-4y5z-6a7b-c8d9e0f1g2h3',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    subject: 'Lobby Renovation Plans',
    recipients: ['architect@example.com', 'contractor@example.com'],
    dueDate: '2024-05-15',
    notes: 'Please review and provide feedback by the due date',
    status: 'sent',
    workflowId: 'b8c9d0e1-f2g3-4h5i-6j7k-8l9m0n1o2p3',
    currentStep: 2,
    createdAt: '2024-04-01T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-01T10:30:00Z'
  },
  {
    id: 't9u0v1w2-x3y4-5z6a-7b8c-d9e0f1g2h3i4',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    subject: 'HVAC System Specifications',
    recipients: ['engineer@example.com', 'vendor@example.com'],
    dueDate: '2024-04-30',
    notes: 'Technical specifications for the new HVAC system',
    status: 'pending',
    workflowId: 'c9d0e1f2-g3h4-5i6j-7k8l-9m0n1o2p3q4',
    currentStep: 1,
    createdAt: '2024-04-05T14:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-05T14:45:00Z'
  }
];

export interface TransmittalUpdate {
  subject?: string;
  recipients?: string[];
  dueDate?: string;
  notes?: string;
  status?: 'draft' | 'pending' | 'sent' | 'acknowledged';
  currentStep?: number;
}

export interface Transmittal {
  id: string;
  propertyId: string;
  subject: string;
  recipients: string[];
  dueDate: string;
  notes?: string;
  status: 'draft' | 'pending' | 'sent' | 'acknowledged';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadTransmittals = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'sent' | 'acknowledged'
): Promise<Transmittal[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredTransmittals = mockTransmittals.filter(transmittal => transmittal.propertyId === propertyId);
      
      if (status) {
        filteredTransmittals = filteredTransmittals.filter(transmittal => transmittal.status === status);
      }
      
      return filteredTransmittals;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('transmittals')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading transmittals:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      subject: row.subject,
      recipients: row.recipients,
      dueDate: row.due_date,
      notes: row.notes,
      status: row.status,
      workflowId: row.workflow_id,
      currentStep: row.current_step,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading transmittals:', error);
    return [];
  }
};

export const createTransmittal = async (
  transmittal: Omit<Transmittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Transmittal | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newTransmittal: Transmittal = {
        ...transmittal,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockTransmittals.push(newTransmittal);
      return newTransmittal;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('transmittals')
      .insert([{
        property_id: transmittal.propertyId,
        subject: transmittal.subject,
        recipients: transmittal.recipients,
        due_date: transmittal.dueDate,
        notes: transmittal.notes,
        status: transmittal.status,
        workflow_id: transmittal.workflowId,
        current_step: transmittal.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating transmittal:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      subject: data.subject,
      recipients: data.recipients,
      dueDate: data.due_date,
      notes: data.notes,
      status: data.status,
      workflowId: data.workflow_id,
      currentStep: data.current_step,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating transmittal:', error);
    return null;
  }
};

export const updateTransmittal = async (
  id: string,
  updates: TransmittalUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('transmittals')
    .update({
      subject: updates.subject,
      recipients: updates.recipients,
      due_date: updates.dueDate,
      notes: updates.notes,
      status: updates.status,
      current_step: updates.currentStep,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating transmittal:', error);
    return false;
  }

  return true;
};

export const deleteTransmittal = async (id: string): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const initialLength = mockTransmittals.length;
      mockTransmittals = mockTransmittals.filter(transmittal => transmittal.id !== id);
      return mockTransmittals.length < initialLength;
    }
    
    // In production, delete from Supabase
    const { error } = await supabase
      .from('transmittals')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Error deleting transmittal:', error);
      return false;
    }
  
    return true;
  } catch (error) {
    console.error('Error deleting transmittal:', error);
    return false;
  }
};