import { request } from '../lib/apiClient';

// Align status literals with backend schema if they differ.
// Budget schema status: ('draft', 'pending', 'approved', 'rejected', 'active', 'closed')
type BudgetStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'closed';
// BudgetRequest & BudgetTransfer schema status: ('draft', 'pending', 'approved', 'rejected')
type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected';


export interface Budget {
  id: string;
  propertyId: string;
  category: string;
  code: string;
  totalBudget: number;
  utilizedBudget: number;
  year: number;
  status?: BudgetStatus; // Added status from schema
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BudgetRequest {
  id: string;
  propertyId: string;
  budgetId: string; // FK to budgets table
  title: string;
  description?: string;
  amount: number;
  status: RequestStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BudgetTransfer {
  id: string;
  propertyId: string;
  fromBudgetId: string; // FK to budgets table
  toBudgetId: string; // FK to budgets table
  amount: number;
  reason?: string;
  status: RequestStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Mapping helpers
const mapToFrontendBudget = (data: any): Budget => ({
  id: data.id,
  propertyId: data.property_id,
  category: data.category,
  code: data.code,
  totalBudget: parseFloat(data.total_budget) || 0,
  utilizedBudget: parseFloat(data.utilized_budget) || 0,
  year: data.year,
  status: data.status as BudgetStatus,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToFrontendBudgetRequest = (data: any): BudgetRequest => ({
  id: data.id,
  propertyId: data.property_id,
  budgetId: data.budget_id,
  title: data.title,
  description: data.description,
  amount: parseFloat(data.amount) || 0,
  status: data.status as RequestStatus,
  workflowId: data.workflow_id,
  currentStep: data.current_step,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToFrontendBudgetTransfer = (data: any): BudgetTransfer => ({
  id: data.id,
  propertyId: data.property_id,
  fromBudgetId: data.from_budget_id,
  toBudgetId: data.to_budget_id,
  amount: parseFloat(data.amount) || 0,
  reason: data.reason,
  status: data.status as RequestStatus,
  workflowId: data.workflow_id,
  currentStep: data.current_step,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToBackendPayload = (item: any, itemType: 'budget' | 'budgetRequest' | 'budgetTransfer'): any => {
  const payload: any = { ...item };
  delete payload.id; // Cannot send id for create
  delete payload.createdAt;
  delete payload.createdBy;
  delete payload.updatedAt;
  delete payload.updatedBy;

  if (payload.propertyId !== undefined) { payload.property_id = payload.propertyId; delete payload.propertyId; }
  if (payload.budgetId !== undefined) { payload.budget_id = payload.budgetId; delete payload.budgetId; }
  if (payload.workflowId !== undefined) { payload.workflow_id = payload.workflowId; delete payload.workflowId; }
  if (payload.currentStep !== undefined) { payload.current_step = payload.currentStep; delete payload.currentStep; }

  if (itemType === 'budget') {
    if (payload.totalBudget !== undefined) { payload.total_budget = payload.totalBudget; delete payload.totalBudget; }
    if (payload.utilizedBudget !== undefined) { payload.utilized_budget = payload.utilizedBudget; delete payload.utilizedBudget; }
  }
  if (itemType === 'budgetTransfer') {
    if (payload.fromBudgetId !== undefined) { payload.from_budget_id = payload.fromBudgetId; delete payload.fromBudgetId; }
    if (payload.toBudgetId !== undefined) { payload.to_budget_id = payload.toBudgetId; delete payload.toBudgetId; }
  }
  return payload;
};


export const loadBudgets = async (propertyId: string, year?: number): Promise<Budget[]> => {
  // TODO: Define backend API: GET /api/budgets?propertyId=X&year=Y
  let endpoint = `/api/budgets?propertyId=${propertyId}`;
  if (year) endpoint += `&year=${year}`;
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendBudget);
  } catch (error) {
    console.error('Error loading budgets via API:', error);
    return [];
  }
};

export const loadBudgetRequests = async (
  propertyId: string,
  status?: RequestStatus
): Promise<BudgetRequest[]> => {
  // TODO: Define backend API: GET /api/budget-requests?propertyId=X&status=Y
  let endpoint = `/api/budget-requests?propertyId=${propertyId}`;
  if (status) endpoint += `&status=${status}`;
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendBudgetRequest);
  } catch (error) {
    console.error('Error loading budget requests via API:', error);
    return [];
  }
};

export const loadBudgetTransfers = async (
  propertyId: string,
  status?: RequestStatus
): Promise<BudgetTransfer[]> => {
  // TODO: Define backend API: GET /api/budget-transfers?propertyId=X&status=Y
  let endpoint = `/api/budget-transfers?propertyId=${propertyId}`;
  if (status) endpoint += `&status=${status}`;
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendBudgetTransfer);
  } catch (error) {
    console.error('Error loading budget transfers via API:', error);
    return [];
  }
};

export const createBudgetRequest = async (
  requestData: Omit<BudgetRequest, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: RequestStatus }
): Promise<BudgetRequest | null> => {
  // TODO: Define backend API: POST /api/budget-requests
  try {
    const payload = mapToBackendPayload(requestData, 'budgetRequest');
    if(!payload.status) payload.status = 'draft';

    const data = await request<any>('/api/budget-requests', {
      method: 'POST',
      body: payload,
    });
    return mapToFrontendBudgetRequest(data);
  } catch (error) {
    console.error('Error creating budget request via API:', error);
    return null;
  }
};

export const createBudgetTransfer = async (
  transferData: Omit<BudgetTransfer, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: RequestStatus }
): Promise<BudgetTransfer | null> => {
  // TODO: Define backend API: POST /api/budget-transfers
  try {
    const payload = mapToBackendPayload(transferData, 'budgetTransfer');
    if(!payload.status) payload.status = 'draft';
    
    const data = await request<any>('/api/budget-transfers', {
      method: 'POST',
      body: payload,
    });
    return mapToFrontendBudgetTransfer(data);
  } catch (error) {
    console.error('Error creating budget transfer via API:', error);
    return null;
  }
};

// TODO: Add update/delete functions for budgets, budget_requests, budget_transfers as needed.
// Example for updating a budget request status:
// export const updateBudgetRequestStatus = async (id: string, status: RequestStatus): Promise<BudgetRequest | null> => {
//   try {
//     const data = await request<any>(`/api/budget-requests/${id}/status`, { // Or use PATCH /api/budget-requests/:id
//       method: 'PATCH', // or PUT
//       body: { status },
//     });
//     return mapToFrontendBudgetRequest(data);
//   } catch (error) {
//     console.error(`Error updating budget request ${id} status:`, error);
//     return null;
//   }
// };

export interface BudgetRequestUpdate {
  title?: string;
  description?: string;
  amount?: number;
  status?: RequestStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  // Add other updatable fields as necessary
}

export const updateBudgetRequest = async (
  id: string,
  updates: BudgetRequestUpdate
): Promise<BudgetRequest | null> => {
  // TODO: Define backend API: PATCH /api/budget-requests/:id
  try {
    const payload = mapToBackendPayload(updates, 'budgetRequest'); // mapToBackendPayload needs to handle updates too
    const data = await request<any>(`/api/budget-requests/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendBudgetRequest(data);
  } catch (error) {
    console.error(`Error updating budget request ${id} via API:`, error);
    return null;
  }
};