import { request } from '../lib/apiClient';
import { Property, Currency } from '../types/property'; // Assuming Currency is also exported from property types

// Interface for the raw property data expected from the backend API
// This should match the structure from the 'properties' table in schema.sql
interface BackendPropertyData {
  id: string;
  name: string;
  location: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  general_manager?: string | null;
  type: string;
  rooms: number;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  budget_utilization?: number | null;
  image_url?: string | null;
  created_at?: string; // Timestamps from backend
  updated_at?: string;
  created_by?: string; // User ID
  updated_by?: string; // User ID
}

// Helper function to map backend data to frontend Property type
const mapToFrontendProperty = (bp: BackendPropertyData): Property => {
  return {
    id: bp.id,
    name: bp.name,
    location: bp.location,
    address: bp.address,
    phone: bp.phone || '',
    email: bp.email || '',
    generalManager: bp.general_manager || '',
    type: bp.type,
    rooms: bp.rooms,
    currency: { // Assuming Property type has a nested currency object
      code: bp.currency_code,
      symbol: bp.currency_symbol,
      name: bp.currency_name,
    },
    budgetUtilization: bp.budget_utilization || 0,
    image: bp.image_url || '', // Provide a default or ensure it's always there
    // Frontend Property type might not have created_at, created_by etc.
    // Add them if they are part of the frontend type and needed.
  };
};

// Helper function to map frontend Property (for create/update) to backend payload
const mapToBackendPayload = (property: Partial<Omit<Property, 'id' | 'budgetUtilization'>>) => {
  const payload: any = { ...property };
  if (property.currency) {
    payload.currency_code = property.currency.code;
    payload.currency_symbol = property.currency.symbol;
    payload.currency_name = property.currency.name;
    delete payload.currency; // Remove the nested object
  }
  if (property.generalManager) {
    payload.general_manager = property.generalManager;
    delete payload.generalManager;
  }
   if (property.image) {
    payload.image_url = property.image;
    // delete payload.image; // Only delete if 'image' is not a valid backend fieldname
  }
  // Remove fields not directly on the backend 'properties' table or handled otherwise (like id, budgetUtilization)
  // delete payload.id; // ID is not part of create payload, and usually not updatable directly for PATCH
  // delete payload.budgetUtilization; // Usually calculated or updated via other means
  return payload;
};


/**
 * Load properties from the backend API
 */
export const loadProperties = async (): Promise<Property[]> => {
  // TODO: Define backend API endpoint: GET /api/properties
  try {
    const data = await request<BackendPropertyData[]>('/api/properties', { method: 'GET' });
    return data.map(mapToFrontendProperty);
  } catch (error) {
    console.error('Error loading properties via API:', error);
    return [];
  }
};

/**
 * Get a property by ID from the backend API
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  // TODO: Define backend API endpoint: GET /api/properties/:id
  try {
    const data = await request<BackendPropertyData>(`/api/properties/${id}`, { method: 'GET' });
    return data ? mapToFrontendProperty(data) : null;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Error getting property ${id} via API:`, error);
    return null; // Or throw error
  }
};

/**
 * Save (create) a new property via the backend API
 */
export const saveProperty = async (propertyData: Omit<Property, 'id' | 'budgetUtilization'>): Promise<Property | null> => {
  // TODO: Define backend API endpoint: POST /api/properties
  // Backend will set id, created_at, created_by (from JWT), budgetUtilization (default or calculated)
  try {
    const payload = mapToBackendPayload(propertyData);
    const data = await request<BackendPropertyData>('/api/properties', {
      method: 'POST',
      body: payload,
    });
    return data ? mapToFrontendProperty(data) : null;
  } catch (error) {
    console.error('Error saving property via API:', error);
    return null; // Or throw error
  }
};

/**
 * Update an existing property via the backend API
 * (This function was not in the original properties.ts, adding it for completeness if needed)
 */
export const updateProperty = async (id: string, propertyData: Partial<Omit<Property, 'id' | 'budgetUtilization'>>): Promise<Property | null> => {
  // TODO: Define backend API endpoint: PATCH /api/properties/:id
  // Backend will set updated_at, updated_by (from JWT)
  try {
    const payload = mapToBackendPayload(propertyData);
    const data = await request<BackendPropertyData>(`/api/properties/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return data ? mapToFrontendProperty(data) : null;
  } catch (error) {
    console.error(`Error updating property ${id} via API:`, error);
    return null; // Or throw error
  }
};

/**
 * Delete a property by ID via the backend API
 * (This function was not in the original properties.ts, adding it for completeness if needed)
 */
export const deleteProperty = async (id: string): Promise<boolean> => {
  // TODO: Define backend API endpoint: DELETE /api/properties/:id
  try {
    await request<void>(`/api/properties/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting property ${id} via API:`, error);
    return false;
  }
};