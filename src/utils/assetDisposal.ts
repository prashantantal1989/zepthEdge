import { request } from '../lib/apiClient';

// Align with backend schema status: ('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled')
type AssetDisposalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface AssetDisposalUpdate {
  assetType?: string;
  assetDescription?: string;
  assetTagId?: string;
  netBookValue?: number | null; // Allow null
  disposableValue?: number | null; // Allow null
  quantity?: number;
  vendor?: string;
  reason?: string;
  status?: AssetDisposalStatus;
  // currentStep and workflowId are usually managed by workflow engine on backend
  assetId?: string | null; // From schema
}

export interface AssetDisposal {
  id: string;
  propertyId: string;
  assetId?: string | null; // From schema
  assetType: string;
  assetDescription: string;
  assetTagId?: string | null; // From schema
  netBookValue?: number | null; // From schema
  disposableValue?: number | null; // From schema
  quantity: number;
  vendor?: string | null; // From schema
  reason: string;
  status: AssetDisposalStatus;
  workflowId?: string | null; // From schema
  currentStep?: number | null; // From schema
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

// Helper to map backend data to frontend AssetDisposal type
const mapToFrontendAssetDisposal = (data: any): AssetDisposal => ({
  id: data.id,
  propertyId: data.property_id,
  assetId: data.asset_id,
  assetType: data.asset_type,
  assetDescription: data.asset_description,
  assetTagId: data.asset_tag_id,
  netBookValue: data.net_book_value ? parseFloat(data.net_book_value) : null,
  disposableValue: data.disposable_value ? parseFloat(data.disposable_value) : null,
  quantity: data.quantity,
  vendor: data.vendor,
  reason: data.reason,
  status: data.status as AssetDisposalStatus,
  workflowId: data.workflow_id,
  currentStep: data.current_step,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

// Helper to map frontend AssetDisposal data (for create/update) to backend payload
const mapToBackendAssetDisposalPayload = (
  disposalData: Partial<AssetDisposalUpdate> | Omit<AssetDisposal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
  if ('propertyId' in disposalData && disposalData.propertyId !== undefined) payload.property_id = disposalData.propertyId;
  if (disposalData.assetId !== undefined) payload.asset_id = disposalData.assetId;
  if (disposalData.assetType !== undefined) payload.asset_type = disposalData.assetType;
  if (disposalData.assetDescription !== undefined) payload.asset_description = disposalData.assetDescription;
  if (disposalData.assetTagId !== undefined) payload.asset_tag_id = disposalData.assetTagId;
  if (disposalData.netBookValue !== undefined) payload.net_book_value = disposalData.netBookValue;
  if (disposalData.disposableValue !== undefined) payload.disposable_value = disposalData.disposableValue;
  if (disposalData.quantity !== undefined) payload.quantity = disposalData.quantity;
  if (disposalData.vendor !== undefined) payload.vendor = disposalData.vendor;
  if (disposalData.reason !== undefined) payload.reason = disposalData.reason;
  if (disposalData.status !== undefined) payload.status = disposalData.status;
  if ('workflowId' in disposalData && disposalData.workflowId !== undefined) payload.workflow_id = disposalData.workflowId;
  if ('currentStep' in disposalData && disposalData.currentStep !== undefined) payload.current_step = disposalData.currentStep;

  // created_by, updated_by are handled by backend
  return payload;
};


export const loadAssetDisposals = async (
  propertyId: string,
  status?: AssetDisposalStatus
): Promise<AssetDisposal[]> => {
  // TODO: Define backend API: GET /api/asset-disposals?propertyId=X&status=Y
  // Or /api/properties/X/asset-disposals?status=Y
  let endpoint = `/api/asset-disposals?propertyId=${propertyId}`;
  if (status) endpoint += `&status=${status}`;
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendAssetDisposal);
  } catch (error) {
    console.error('Error loading asset disposals via API:', error);
    return [];
  }
};

export const createAssetDisposal = async (
  disposalData: Omit<AssetDisposal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> & { status?: AssetDisposalStatus }
): Promise<AssetDisposal | null> => {
  // TODO: Define backend API: POST /api/asset-disposals
  try {
    const payload = mapToBackendAssetDisposalPayload(disposalData);
    if(!payload.status) payload.status = 'draft'; // Default status

    const data = await request<any>('/api/asset-disposals', {
      method: 'POST',
      body: payload,
    });
    return mapToFrontendAssetDisposal(data);
  } catch (error) {
    console.error('Error creating asset disposal via API:', error);
    return null;
  }
};

export const updateAssetDisposal = async (
  id: string,
  updates: AssetDisposalUpdate
): Promise<AssetDisposal | null> => {
  // TODO: Define backend API: PATCH /api/asset-disposals/:id
  try {
    const payload = mapToBackendAssetDisposalPayload(updates);
    const data = await request<any>(`/api/asset-disposals/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendAssetDisposal(data);
  } catch (error) {
    console.error(`Error updating asset disposal ${id} via API:`, error);
    return null;
  }
};

export const deleteAssetDisposal = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/asset-disposals/:id
  try {
    await request<void>(`/api/asset-disposals/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting asset disposal ${id} via API:`, error);
    return false;
  }
};

// TODO: Add getAssetDisposalById(id: string) if needed