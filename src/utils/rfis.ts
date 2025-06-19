import { request } from '../lib/apiClient';

// Interfaces remain largely the same.
// Ensure status literals match backend expectations or map them.
// The backend schema uses: ('open', 'pending_response', 'answered', 'closed', 'cancelled')
type RfiStatus = 'open' | 'pending_response' | 'answered' | 'closed' | 'cancelled';


export interface RFIUpdate {
  subject?: string;
  category?: string;
  question?: string;
  assignedTo?: string; // Should be user ID
  dueDate?: string;
  status?: RfiStatus;
  // currentStep and workflowId are usually managed by workflow engine on backend
}

export interface RFI {
  id: string;
  propertyId?: string; // Optional if RFI can be non-property specific
  subject: string;
  category: string;
  question: string;
  assignedTo?: string; // User ID
  dueDate?: string; // Made optional to align with schema which allows NULL
  status: RfiStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

// Helper to map backend data to frontend RFI type
// Assuming backend field names like property_id, assigned_to, due_date, workflow_id, current_step, created_at etc.
const mapToFrontendRfi = (data: any): RFI => {
  return {
    id: data.id,
    propertyId: data.property_id,
    subject: data.subject,
    category: data.category,
    question: data.question,
    assignedTo: data.assigned_to,
    dueDate: data.due_date,
    status: data.status as RfiStatus,
    workflowId: data.workflow_id,
    currentStep: data.current_step,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
};

// Helper to map frontend RFI data (for create/update) to backend payload
const mapToBackendRfiPayload = (rfiData: Partial<RFIUpdate> | Omit<RFI, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): any => {
  const payload: any = {};
  if (rfiData.subject !== undefined) payload.subject = rfiData.subject;
  if (rfiData.category !== undefined) payload.category = rfiData.category;
  if (rfiData.question !== undefined) payload.question = rfiData.question;
  if ('propertyId' in rfiData && rfiData.propertyId !== undefined) payload.property_id = rfiData.propertyId;
  if (rfiData.assignedTo !== undefined) payload.assigned_to = rfiData.assignedTo;
  if (rfiData.dueDate !== undefined) payload.due_date = rfiData.dueDate;
  if (rfiData.status !== undefined) payload.status = rfiData.status;
  if ('workflowId' in rfiData && rfiData.workflowId !== undefined) payload.workflow_id = rfiData.workflowId;
  if ('currentStep' in rfiData && rfiData.currentStep !== undefined) payload.current_step = rfiData.currentStep;
  // created_by, updated_by are handled by backend
  return payload;
};


export const loadRFIs = async (
  propertyId?: string, // Optional
  status?: RfiStatus
): Promise<RFI[]> => {
  // TODO: Define backend API: GET /api/rfis?propertyId=X&status=Y
  let endpoint = '/api/rfis';
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (status) params.append('status', status);
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await request<any[]>(endpoint, { method: 'GET' }); // Replace any[] with BackendRfi[]
    return data.map(mapToFrontendRfi);
  } catch (error) {
    console.error('Error loading RFIs via API:', error);
    return [];
  }
};

export const createRFI = async (
  rfiData: Omit<RFI, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: RfiStatus }
): Promise<RFI | null> => {
  // TODO: Define backend API: POST /api/rfis
  // Backend sets id, created_by, created_at, updated_at, status (e.g. 'open' by default)
  try {
    const payload = mapToBackendRfiPayload(rfiData);
    // Ensure a default status if not provided, or let backend handle it
    if (!payload.status) payload.status = 'open';

    const data = await request<any>('/api/rfis', { // Replace any with BackendRfi
      method: 'POST',
      body: payload,
    });
    return mapToFrontendRfi(data);
  } catch (error) {
    console.error('Error creating RFI via API:', error);
    return null;
  }
};

export const updateRFI = async (
  id: string,
  updates: RFIUpdate
): Promise<RFI | null> => {
  // TODO: Define backend API: PATCH /api/rfis/:id
  // Backend sets updated_by, updated_at
  try {
    const payload = mapToBackendRfiPayload(updates);
    const data = await request<any>(`/api/rfis/${id}`, { // Replace any with BackendRfi
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendRfi(data);
  } catch (error) {
    console.error(`Error updating RFI ${id} via API:`, error);
    return null; // Or throw error
  }
};

export const deleteRFI = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/rfis/:id
  try {
    await request<void>(`/api/rfis/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting RFI ${id} via API:`, error);
    return false;
  }
};

// TODO: Add getRFIById(id: string) if needed, calling GET /api/rfis/:id