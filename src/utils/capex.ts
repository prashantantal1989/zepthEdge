import { supabase } from '../lib/supabase';

// Mock data for development
const mockCapexRequests: CapexRequest[] = [
  {
    id: 'h7i8j9k0-l1m2-3n4o-5p6q-r7s8t9u0v1w2',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    budgetId: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    projectName: 'Lobby Renovation',
    category: 'Facilities',
    budgetReference: 'FAC-2025-001',
    amount: 75000,
    startDate: '2025-03-15',
    endDate: '2025-05-30',
    status: 'pending',
    projectLead: 'John Smith',
    department: 'Operations',
    subDepartment: 'Facilities',
    designConsultant: 'Modern Design Co.',
    mainContractor: 'BuildRight Construction',
    description: 'Complete renovation of the main lobby area including new flooring, lighting, and furniture',
    titleArea: 'Main Lobby',
    remarks: 'Priority project to improve guest first impressions',
    workflowId: 'z7a8b9c0-d1e2-3f4g-5h6i-j7k8l9m0n1o2',
    currentStep: 1,
    createdAt: '2024-02-10T09:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-02-15T14:45:00Z'
  },
  {
    id: 'i8j9k0l1-m2n3-4o5p-6q7r-s8t9u0v1w2x3',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    budgetId: 'd3e4f5g6-h7i8-9j0k-1l2m-n3o4p5q6r7s8',
    projectName: 'HVAC System Upgrade',
    category: 'Engineering',
    budgetReference: 'ENG-2025-003',
    amount: 120000,
    startDate: '2025-04-10',
    endDate: '2025-06-15',
    status: 'approved',
    projectLead: 'Emily Johnson',
    department: 'Engineering',
    subDepartment: 'Mechanical',
    designConsultant: 'TechSystems Engineering',
    mainContractor: 'Climate Control Solutions',
    description: 'Upgrade of the hotel HVAC system to improve energy efficiency and guest comfort',
    titleArea: 'Building Systems',
    remarks: 'Expected to reduce energy costs by 15%',
    workflowId: 'a8b9c0d1-e2f3-4g5h-6i7j-k8l9m0n1o2p3',
    currentStep: 3,
    createdAt: '2024-01-25T11:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-02-05T16:30:00Z'
  }
];

export interface CapexRequestUpdate {
  projectName?: string;
  category?: string;
  budgetReference?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  projectLead?: string;
  department?: string;
  subDepartment?: string;
  designConsultant?: string;
  mainContractor?: string;
  description?: string;
  titleArea?: string;
  remarks?: string;
  currentStep?: number;
}

export interface CapexRequest {
  id: string;
  propertyId: string;
  budgetId: string;
  projectName: string;
  category: string;
  budgetReference: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  projectLead: string;
  department: string;
  subDepartment: string;
  designConsultant?: string;
  mainContractor?: string;
  description: string;
  titleArea: string;
  remarks?: string;
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadCapexRequests = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
): Promise<CapexRequest[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredRequests = mockCapexRequests.filter(request => request.propertyId === propertyId);
      
      if (status) {
        filteredRequests = filteredRequests.filter(request => request.status === status);
      }
      
      return filteredRequests;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('capex_requests')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading CAPEX requests:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      budgetId: row.budget_id,
      projectName: row.project_name,
      category: row.category,
      budgetReference: row.budget_reference,
      amount: row.amount,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      projectLead: row.project_lead,
      department: row.department,
      subDepartment: row.sub_department,
      designConsultant: row.design_consultant,
      mainContractor: row.main_contractor,
      description: row.description,
      titleArea: row.title_area,
      remarks: row.remarks,
      workflowId: row.workflow_id,
      currentStep: row.current_step,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading CAPEX requests:', error);
    return [];
  }
};

export const createCapexRequest = async (
  request: Omit<CapexRequest, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<CapexRequest | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newRequest: CapexRequest = {
        ...request,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockCapexRequests.push(newRequest);
      return newRequest;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('capex_requests')
      .insert([{
        property_id: request.propertyId,
        budget_id: request.budgetId,
        project_name: request.projectName,
        category: request.category,
        budget_reference: request.budgetReference,
        amount: request.amount,
        start_date: request.startDate,
        end_date: request.endDate,
        status: request.status,
        project_lead: request.projectLead,
        department: request.department,
        sub_department: request.subDepartment,
        design_consultant: request.designConsultant,
        main_contractor: request.mainContractor,
        description: request.description,
        title_area: request.titleArea,
        remarks: request.remarks,
        workflow_id: request.workflowId,
        current_step: request.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating CAPEX request:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      budgetId: data.budget_id,
      projectName: data.project_name,
      category: data.category,
      budgetReference: data.budget_reference,
      amount: data.amount,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      projectLead: data.project_lead,
      department: data.department,
      subDepartment: data.sub_department,
      designConsultant: data.design_consultant,
      mainContractor: data.main_contractor,
      description: data.description,
      titleArea: data.title_area,
      remarks: data.remarks,
      workflowId: data.workflow_id,
      currentStep: data.current_step,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating CAPEX request:', error);
    return null;
  }
};

export const updateCapexRequest = async (
  id: string,
  updates: CapexRequestUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('capex_requests')
    .update({
      project_name: updates.projectName,
      category: updates.category,
      budget_reference: updates.budgetReference,
      amount: updates.amount,
      start_date: updates.startDate,
      end_date: updates.endDate,
      status: updates.status,
      project_lead: updates.projectLead,
      department: updates.department,
      sub_department: updates.subDepartment,
      design_consultant: updates.designConsultant,
      main_contractor: updates.mainContractor,
      description: updates.description,
      title_area: updates.titleArea,
      remarks: updates.remarks,
      current_step: updates.currentStep,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating CAPEX request:', error);
    return false;
  }

  return true;
};

export const deleteCapexRequest = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('capex_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting CAPEX request:', error);
    return false;
  }

  return true;
};