import { request } from '../lib/apiClient';

// Backend schema status: ('draft', 'pending', 'sent', 'acknowledged', 'overdue', 'cancelled')
type TransmittalStatus = 'draft' | 'pending' | 'sent' | 'acknowledged' | 'overdue' | 'cancelled';

export interface TransmittalUpdate {
  subject?: string;
  recipients?: string[];
  dueDate?: string | null; // Allow null to remove due date
  notes?: string;
  status?: TransmittalStatus;
  // currentStep and workflowId are usually managed by workflow engine on backend
}

export interface Transmittal {
  id: string;
  propertyId?: string; // Optional if transmittal can be non-property specific
  subject: string;
  recipients: string[];
  dueDate?: string | null; // Align with schema (can be null)
  notes?: string;
  status: TransmittalStatus;
  workflowId?: string | null;
  currentStep?: number | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

// Helper to map backend data to frontend Transmittal type
const mapToFrontendTransmittal = (data: any): Transmittal => {
  return {
    id: data.id,
    propertyId: data.property_id,
    subject: data.subject,
    recipients: data.recipients || [], // Ensure recipients is an array
    dueDate: data.due_date,
    notes: data.notes,
    status: data.status as TransmittalStatus,
    workflowId: data.workflow_id,
    currentStep: data.current_step,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
};

// Helper to map frontend Transmittal data (for create/update) to backend payload
const mapToBackendTransmittalPayload = (
  transmittalData: Partial<TransmittalUpdate> | Omit<Transmittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
  if (transmittalData.subject !== undefined) payload.subject = transmittalData.subject;
  if (transmittalData.recipients !== undefined) payload.recipients = transmittalData.recipients;
  if (transmittalData.dueDate !== undefined) payload.due_date = transmittalData.dueDate; // Handles null for removal
  if (transmittalData.notes !== undefined) payload.notes = transmittalData.notes;
  if (transmittalData.status !== undefined) payload.status = transmittalData.status;

  if ('propertyId' in transmittalData && transmittalData.propertyId !== undefined) payload.property_id = transmittalData.propertyId;
  if ('workflowId' in transmittalData && transmittalData.workflowId !== undefined) payload.workflow_id = transmittalData.workflowId;
  if ('currentStep' in transmittalData && transmittalData.currentStep !== undefined) payload.current_step = transmittalData.currentStep;
  // created_by, updated_by are handled by backend
  return payload;
};


export const loadTransmittals = async (
  propertyId?: string, // Optional
  status?: TransmittalStatus
): Promise<Transmittal[]> => {
  // TODO: Define backend API: GET /api/transmittals?propertyId=X&status=Y
  let endpoint = '/api/transmittals';
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (status) params.append('status', status);
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await request<any[]>(endpoint, { method: 'GET' }); // Replace any[] with BackendTransmittal[]
    return data.map(mapToFrontendTransmittal);
  } catch (error) {
    console.error('Error loading transmittals via API:', error);
    return [];
  }
};

export const createTransmittal = async (
  transmittalData: Omit<Transmittal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: TransmittalStatus }
): Promise<Transmittal | null> => {
  // TODO: Define backend API: POST /api/transmittals
  // Backend sets id, created_by, created_at, updated_at, status (e.g. 'draft' by default)
  try {
    const payload = mapToBackendTransmittalPayload(transmittalData);
    if (!payload.status) payload.status = 'draft'; // Default status

    const data = await request<any>('/api/transmittals', { // Replace any with BackendTransmittal
      method: 'POST',
      body: payload,
    });
    return mapToFrontendTransmittal(data);
  } catch (error) {
    console.error('Error creating transmittal via API:', error);
    return null;
  }
};

export const updateTransmittal = async (
  id: string,
  updates: TransmittalUpdate
): Promise<Transmittal | null> => {
  // TODO: Define backend API: PATCH /api/transmittals/:id
  // Backend sets updated_by, updated_at
  try {
    const payload = mapToBackendTransmittalPayload(updates);
    const data = await request<any>(`/api/transmittals/${id}`, { // Replace any with BackendTransmittal
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendTransmittal(data);
  } catch (error) {
    console.error(`Error updating transmittal ${id} via API:`, error);
    return null; // Or throw error
  }
};

export const deleteTransmittal = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/transmittals/:id
  try {
    await request<void>(`/api/transmittals/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting transmittal ${id} via API:`, error);
    return false;
  }
};

// TODO: Add getTransmittalById(id: string) if needed