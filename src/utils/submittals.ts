import { request } from '../lib/apiClient';

// Backend schema status: ('draft', 'pending_review', 'approved', 'rejected', 'resubmit', 'cancelled')
type SubmittalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'resubmit' | 'cancelled';

export interface SubmittalUpdate {
  title?: string;
  category?: string;
  description?: string;
  status?: SubmittalStatus;
  // currentStep and workflowId are usually managed by workflow engine on backend
}

export interface Submittal {
  id: string;
  propertyId?: string; // Optional if submittal can be non-property specific
  title: string;
  category: string;
  description?: string;
  status: SubmittalStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

// Helper to map backend data to frontend Submittal type
const mapToFrontendSubmittal = (data: any): Submittal => {
  return {
    id: data.id,
    propertyId: data.property_id,
    title: data.title,
    category: data.category,
    description: data.description,
    status: data.status as SubmittalStatus,
    workflowId: data.workflow_id,
    currentStep: data.current_step,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
};

// Helper to map frontend Submittal data (for create/update) to backend payload
const mapToBackendSubmittalPayload = (
  submittalData: Partial<SubmittalUpdate> | Omit<Submittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
  if (submittalData.title !== undefined) payload.title = submittalData.title;
  if (submittalData.category !== undefined) payload.category = submittalData.category;
  if (submittalData.description !== undefined) payload.description = submittalData.description;
  if ('propertyId' in submittalData && submittalData.propertyId !== undefined) payload.property_id = submittalData.propertyId;
  if (submittalData.status !== undefined) payload.status = submittalData.status;
  if ('workflowId' in submittalData && submittalData.workflowId !== undefined) payload.workflow_id = submittalData.workflowId;
  if ('currentStep' in submittalData && submittalData.currentStep !== undefined) payload.current_step = submittalData.currentStep;
  // created_by, updated_by are handled by backend
  return payload;
};


export const loadSubmittals = async (
  propertyId?: string, // Optional
  status?: SubmittalStatus
): Promise<Submittal[]> => {
  // TODO: Define backend API: GET /api/submittals?propertyId=X&status=Y
  let endpoint = '/api/submittals';
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (status) params.append('status', status);
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await request<any[]>(endpoint, { method: 'GET' }); // Replace any[] with BackendSubmittal[]
    return data.map(mapToFrontendSubmittal);
  } catch (error) {
    console.error('Error loading submittals via API:', error);
    return [];
  }
};

export const createSubmittal = async (
  submittalData: Omit<Submittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: SubmittalStatus }
): Promise<Submittal | null> => {
  // TODO: Define backend API: POST /api/submittals
  // Backend sets id, created_by, created_at, updated_at, status (e.g. 'draft' by default)
  try {
    const payload = mapToBackendSubmittalPayload(submittalData);
    if (!payload.status) payload.status = 'draft'; // Default status

    const data = await request<any>('/api/submittals', { // Replace any with BackendSubmittal
      method: 'POST',
      body: payload,
    });
    return mapToFrontendSubmittal(data);
  } catch (error) {
    console.error('Error creating submittal via API:', error);
    return null;
  }
};

export const updateSubmittal = async (
  id: string,
  updates: SubmittalUpdate
): Promise<Submittal | null> => {
  // TODO: Define backend API: PATCH /api/submittals/:id
  // Backend sets updated_by, updated_at
  try {
    const payload = mapToBackendSubmittalPayload(updates);
    const data = await request<any>(`/api/submittals/${id}`, { // Replace any with BackendSubmittal
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendSubmittal(data);
  } catch (error) {
    console.error(`Error updating submittal ${id} via API:`, error);
    return null; // Or throw error
  }
};

export const deleteSubmittal = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/submittals/:id
  try {
    await request<void>(`/api/submittals/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting submittal ${id} via API:`, error);
    return false;
  }
};

// TODO: Add getSubmittalById(id: string) if needed, calling GET /api/submittals/:id