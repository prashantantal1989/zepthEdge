import { request } from '../lib/apiClient';

// Align status/condition literals with backend schema if they differ
type AssetStatus = 'active' | 'maintenance' | 'disposed' | 'transferred' | 'out_of_service';
type AssetCondition = 'new' | 'good' | 'fair' | 'poor' | 'needs_repair';
type AssetMaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
type AssetTransferStatus = 'pending' | 'completed' | 'cancelled' | 'in_transit';

export interface Asset {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  category: string;
  tagId?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  currentValue?: number | null;
  location?: string | null;
  status: AssetStatus;
  condition?: AssetCondition | null;
  warrantyExpiry?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  supplier?: string | null;
  notes?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

export interface AssetUpdate { // For PATCH requests
  name?: string;
  type?: string;
  category?: string;
  tagId?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  currentValue?: number | null;
  location?: string | null;
  status?: AssetStatus;
  condition?: AssetCondition | null;
  warrantyExpiry?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  supplier?: string | null;
  notes?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}


export interface AssetMaintenance {
  id: string;
  assetId: string;
  propertyId: string; // Denormalized in schema
  maintenanceType: string;
  description: string;
  scheduledDate?: string | null; // From schema
  completedDate?: string | null;
  cost?: number | null;
  performedBy?: string | null;
  status: AssetMaintenanceStatus;
  notes?: string | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

export interface AssetMaintenanceUpdate {
  maintenanceType?: string;
  description?: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  cost?: number | null;
  performedBy?: string | null;
  status?: AssetMaintenanceStatus;
  notes?: string | null;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  fromPropertyId: string;
  toPropertyId: string;
  transferDate: string;
  reason?: string | null;
  status: AssetTransferStatus;
  notes?: string | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}
export interface AssetTransferUpdate {
  fromPropertyId?: string;
  toPropertyId?: string;
  transferDate?: string;
  reason?: string | null;
  status?: AssetTransferStatus;
  notes?: string | null;
}


// --- Mapping Functions ---
const mapToFrontendAsset = (data: any): Asset => ({
  id: data.id,
  propertyId: data.property_id,
  name: data.name,
  type: data.type,
  category: data.category,
  tagId: data.tag_id,
  serialNumber: data.serial_number,
  purchaseDate: data.purchase_date,
  purchaseCost: data.purchase_cost ? parseFloat(data.purchase_cost) : null,
  currentValue: data.current_value ? parseFloat(data.current_value) : null,
  location: data.location,
  status: data.status as AssetStatus,
  condition: data.condition as AssetCondition,
  warrantyExpiry: data.warranty_expiry,
  manufacturer: data.manufacturer,
  model: data.model,
  supplier: data.supplier,
  notes: data.notes,
  metadata: data.metadata,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToBackendAssetPayload = (
  assetData: Partial<AssetUpdate> | Omit<Asset, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
  if ('propertyId' in assetData && assetData.propertyId !== undefined) payload.property_id = assetData.propertyId;
  // Map all other fields, converting camelCase to snake_case for backend
  Object.keys(assetData).forEach(key => {
    if (key === 'propertyId') return; // Already handled
    const backendKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    payload[backendKey] = (assetData as any)[key];
  });
  return payload;
};


const mapToFrontendAssetMaintenance = (data: any): AssetMaintenance => ({
  id: data.id,
  assetId: data.asset_id,
  propertyId: data.property_id,
  maintenanceType: data.maintenance_type,
  description: data.description,
  scheduledDate: data.scheduled_date,
  completedDate: data.completed_date,
  cost: data.cost ? parseFloat(data.cost) : null,
  performedBy: data.performed_by,
  status: data.status as AssetMaintenanceStatus,
  notes: data.notes,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToBackendAssetMaintenancePayload = (
  maintData: Partial<AssetMaintenanceUpdate> | Omit<AssetMaintenance, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
   if ('assetId' in maintData && maintData.assetId !== undefined) payload.asset_id = maintData.assetId;
   if ('propertyId' in maintData && maintData.propertyId !== undefined) payload.property_id = maintData.propertyId;
   if (maintData.maintenanceType !== undefined) payload.maintenance_type = maintData.maintenanceType;
   // ... map other fields similarly
   Object.keys(maintData).forEach(key => {
    if (['assetId', 'propertyId', 'maintenanceType'].includes(key)) return;
    const backendKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    payload[backendKey] = (maintData as any)[key];
  });
  return payload;
};

const mapToFrontendAssetTransfer = (data: any): AssetTransfer => ({
  id: data.id,
  assetId: data.asset_id,
  fromPropertyId: data.from_property_id,
  toPropertyId: data.to_property_id,
  transferDate: data.transfer_date,
  reason: data.reason,
  status: data.status as AssetTransferStatus,
  notes: data.notes,
  createdAt: data.created_at,
  createdBy: data.created_by,
  updatedAt: data.updated_at,
  updatedBy: data.updated_by,
});

const mapToBackendAssetTransferPayload = (
  transferData: Partial<AssetTransferUpdate> | Omit<AssetTransfer, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
   const payload: any = {};
   if ('assetId' in transferData && transferData.assetId !== undefined) payload.asset_id = transferData.assetId;
   if (transferData.fromPropertyId !== undefined) payload.from_property_id = transferData.fromPropertyId;
   if (transferData.toPropertyId !== undefined) payload.to_property_id = transferData.toPropertyId;
   if (transferData.transferDate !== undefined) payload.transfer_date = transferData.transferDate;
    // ... map other fields
   Object.keys(transferData).forEach(key => {
    if (['assetId', 'fromPropertyId', 'toPropertyId', 'transferDate'].includes(key)) return;
    const backendKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    payload[backendKey] = (transferData as any)[key];
  });
  return payload;
};


// --- Asset Functions ---
export const loadAssets = async (
  propertyId: string,
  filters?: {
    type?: string;
    category?: string;
    status?: AssetStatus;
    search?: string;
  }
): Promise<Asset[]> => {
  // TODO: Define backend API: GET /api/assets?propertyId=X&type=Y&category=Z&status=A&search=S
  let endpoint = `/api/assets?propertyId=${propertyId}`;
  if (filters) {
    if (filters.type) endpoint += `&type=${filters.type}`;
    if (filters.category) endpoint += `&category=${filters.category}`;
    if (filters.status) endpoint += `&status=${filters.status}`;
    if (filters.search) endpoint += `&search=${encodeURIComponent(filters.search)}`;
  }
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendAsset);
  } catch (error) {
    console.error('Error loading assets via API:', error);
    return [];
  }
};

export const createAsset = async (
  assetData: Omit<Asset, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Asset | null> => {
  // TODO: Define backend API: POST /api/assets
  try {
    const payload = mapToBackendAssetPayload(assetData);
    const data = await request<any>('/api/assets', { method: 'POST', body: payload });
    return mapToFrontendAsset(data);
  } catch (error) {
    console.error('Error creating asset via API:', error);
    return null;
  }
};

export const updateAsset = async (id: string, updates: AssetUpdate): Promise<Asset | null> => {
  // TODO: Define backend API: PATCH /api/assets/:id
  try {
    const payload = mapToBackendAssetPayload(updates);
    const data = await request<any>(`/api/assets/${id}`, { method: 'PATCH', body: payload });
    return mapToFrontendAsset(data);
  } catch (error) {
    console.error(`Error updating asset ${id} via API:`, error);
    return null;
  }
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/assets/:id
  try {
    await request<void>(`/api/assets/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting asset ${id} via API:`, error);
    return false;
  }
};


// --- Asset Maintenance Functions ---
export const loadAssetMaintenance = async (
  assetId: string,
  status?: AssetMaintenanceStatus
): Promise<AssetMaintenance[]> => {
  // TODO: Define backend API: GET /api/asset-maintenance?assetId=X&status=Y
  let endpoint = `/api/asset-maintenance?assetId=${assetId}`;
  if (status) endpoint += `&status=${status}`;
  try {
    const data = await request<any[]>(endpoint, { method: 'GET' });
    return data.map(mapToFrontendAssetMaintenance);
  } catch (error) {
    console.error('Error loading asset maintenance records via API:', error);
    return [];
  }
};

export const createAssetMaintenance = async (
  maintenanceData: Omit<AssetMaintenance, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<AssetMaintenance | null> => {
  // TODO: Define backend API: POST /api/asset-maintenance
  try {
    const payload = mapToBackendAssetMaintenancePayload(maintenanceData);
    const data = await request<any>('/api/asset-maintenance', { method: 'POST', body: payload });
    return mapToFrontendAssetMaintenance(data);
  } catch (error) {
    console.error('Error creating asset maintenance record via API:', error);
    return null;
  }
};

export const updateAssetMaintenance = async (id: string, updates: AssetMaintenanceUpdate): Promise<AssetMaintenance | null> => {
  // TODO: Define backend API: PATCH /api/asset-maintenance/:id
  try {
    const payload = mapToBackendAssetMaintenancePayload(updates);
    const data = await request<any>(`/api/asset-maintenance/${id}`, { method: 'PATCH', body: payload });
    return mapToFrontendAssetMaintenance(data);
  } catch (error) {
    console.error(`Error updating asset maintenance ${id} via API:`, error);
    return null;
  }
};

export const deleteAssetMaintenance = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/asset-maintenance/:id
  try {
    await request<void>(`/api/asset-maintenance/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting asset maintenance ${id} via API:`, error);
    return false;
  }
};


// --- Asset Transfer Functions ---
// TODO: Implement loadAssetTransfers, createAssetTransfer, updateAssetTransfer, deleteAssetTransfer
// Example:
// export const loadAssetTransfers = async (assetId?: string, fromPropertyId?: string, toPropertyId?: string): Promise<AssetTransfer[]> => {
//   // TODO: Define backend API: GET /api/asset-transfers?assetId=X&fromPropertyId=Y&toPropertyId=Z
//   try {
//     const data = await request<any[]>('/api/asset-transfers', { method: 'GET' }); // Add params
//     return data.map(mapToFrontendAssetTransfer);
//   } catch (error) {
//     console.error('Error loading asset transfers via API:', error);
//     return [];
//   }
// };