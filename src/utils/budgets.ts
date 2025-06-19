import { supabase } from '../lib/supabase';

// Mock data for development
const mockBudgets: Budget[] = [
  {
    id: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    category: 'Operations',
    code: 'OPS',
    totalBudget: 250000,
    utilizedBudget: 125000,
    year: 2025,
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'c2d3e4f5-g6h7-8i9j-0k1l-m2n3o4p5q6r7',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    category: 'Facilities',
    code: 'FAC',
    totalBudget: 180000,
    utilizedBudget: 75000,
    year: 2025,
    createdAt: '2024-01-15T11:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-01-15T11:45:00Z'
  },
  {
    id: 'd3e4f5g6-h7i8-9j0k-1l2m-n3o4p5q6r7s8',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    category: 'Marketing',
    code: 'MKT',
    totalBudget: 120000,
    utilizedBudget: 45000,
    year: 2025,
    createdAt: '2024-01-16T09:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-01-16T09:15:00Z'
  }
];

const mockBudgetRequests: BudgetRequest[] = [
  {
    id: 'e4f5g6h7-i8j9-0k1l-2m3n-o4p5q6r7s8t9',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    budgetId: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    title: 'Staff Training Program',
    description: 'Budget for Q2 staff training and development programs',
    amount: 15000,
    status: 'pending',
    workflowId: 'w4x5y6z7-a8b9-0c1d-2e3f-g4h5i6j7k8l9',
    currentStep: 1,
    createdAt: '2024-04-10T14:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-10T14:30:00Z'
  },
  {
    id: 'f5g6h7i8-j9k0-1l2m-3n4o-p5q6r7s8t9u0',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    budgetId: 'c2d3e4f5-g6h7-8i9j-0k1l-m2n3o4p5q6r7',
    title: 'Lobby Renovation',
    description: 'Partial renovation of the main lobby area',
    amount: 45000,
    status: 'approved',
    workflowId: 'x5y6z7a8-b9c0-1d2e-3f4g-h5i6j7k8l9m0',
    currentStep: 3,
    createdAt: '2024-03-15T10:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-03-20T16:30:00Z'
  }
];

const mockBudgetTransfers: BudgetTransfer[] = [
  {
    id: 'g6h7i8j9-k0l1-2m3n-4o5p-q6r7s8t9u0v1',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    fromBudgetId: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    toBudgetId: 'c2d3e4f5-g6h7-8i9j-0k1l-m2n3o4p5q6r7',
    amount: 25000,
    reason: 'Reallocation of funds for urgent facility repairs',
    status: 'approved',
    workflowId: 'y6z7a8b9-c0d1-2e3f-4g5h-i6j7k8l9m0n1',
    currentStep: 2,
    createdAt: '2024-02-20T11:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-02-22T09:30:00Z'
  }
];

export interface Budget {
  id: string;
  propertyId: string;
  category: string;
  code: string;
  totalBudget: number;
  utilizedBudget: number;
  year: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface BudgetRequest {
  id: string;
  propertyId: string;
  budgetId: string;
  title: string;
  description?: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface BudgetTransfer {
  id: string;
  propertyId: string;
  fromBudgetId: string;
  toBudgetId: string;
  amount: number;
  reason?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadBudgets = async (propertyId: string, year?: number): Promise<Budget[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredBudgets = mockBudgets.filter(budget => budget.propertyId === propertyId);
      
      if (year) {
        filteredBudgets = filteredBudgets.filter(budget => budget.year === year);
      }
      
      return filteredBudgets;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('property_id', propertyId);
  
    if (year) {
      query = query.eq('year', year);
    }
  
    const { data, error } = await query.order('category');
  
    if (error) {
      console.error('Error loading budgets:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      category: row.category,
      code: row.code,
      totalBudget: row.total_budget,
      utilizedBudget: row.utilized_budget,
      year: row.year,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading budgets:', error);
    return [];
  }
};

export const loadBudgetRequests = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
): Promise<BudgetRequest[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredRequests = mockBudgetRequests.filter(request => request.propertyId === propertyId);
      
      if (status) {
        filteredRequests = filteredRequests.filter(request => request.status === status);
      }
      
      return filteredRequests;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('budget_requests')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading budget requests:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      budgetId: row.budget_id,
      title: row.title,
      description: row.description,
      amount: row.amount,
      status: row.status,
      workflowId: row.workflow_id,
      currentStep: row.current_step,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading budget requests:', error);
    return [];
  }
};

export const loadBudgetTransfers = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
): Promise<BudgetTransfer[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredTransfers = mockBudgetTransfers.filter(transfer => transfer.propertyId === propertyId);
      
      if (status) {
        filteredTransfers = filteredTransfers.filter(transfer => transfer.status === status);
      }
      
      return filteredTransfers;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('budget_transfers')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading budget transfers:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      fromBudgetId: row.from_budget_id,
      toBudgetId: row.to_budget_id,
      amount: row.amount,
      reason: row.reason,
      status: row.status,
      workflowId: row.workflow_id,
      currentStep: row.current_step,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading budget transfers:', error);
    return [];
  }
};

export const createBudgetRequest = async (request: Omit<BudgetRequest, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<BudgetRequest | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newRequest: BudgetRequest = {
        ...request,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockBudgetRequests.push(newRequest);
      return newRequest;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('budget_requests')
      .insert([{
        property_id: request.propertyId,
        budget_id: request.budgetId,
        title: request.title,
        description: request.description,
        amount: request.amount,
        status: request.status,
        workflow_id: request.workflowId,
        current_step: request.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating budget request:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      budgetId: data.budget_id,
      title: data.title,
      description: data.description,
      amount: data.amount,
      status: data.status,
      workflowId: data.workflow_id,
      currentStep: data.current_step,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating budget request:', error);
    return null;
  }
};

export const createBudgetTransfer = async (transfer: Omit<BudgetTransfer, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<BudgetTransfer | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newTransfer: BudgetTransfer = {
        ...transfer,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockBudgetTransfers.push(newTransfer);
      return newTransfer;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('budget_transfers')
      .insert([{
        property_id: transfer.propertyId,
        from_budget_id: transfer.fromBudgetId,
        to_budget_id: transfer.toBudgetId,
        amount: transfer.amount,
        reason: transfer.reason,
        status: transfer.status,
        workflow_id: transfer.workflowId,
        current_step: transfer.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating budget transfer:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      fromBudgetId: data.from_budget_id,
      toBudgetId: data.to_budget_id,
      amount: data.amount,
      reason: data.reason,
      status: data.status,
      workflowId: data.workflow_id,
      currentStep: data.current_step,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating budget transfer:', error);
    return null;
  }
};