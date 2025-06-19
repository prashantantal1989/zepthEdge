import { request } from '../lib/apiClient'; // Import the new API client

// Interfaces remain largely the same, but ensure they match frontend needs
// and what the new backend API will provide.
export interface DocumentUpdate {
  name?: string;
  type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  // propertyId should not be updatable for an existing document via this simple update.
  // Path, size, mimeType, createdBy, createdAt, updatedBy, updatedAt are typically managed by backend.
}

export interface Document {
  id: string;
  propertyId?: string; // Made optional, as a document might not be property-specific
  name: string;
  type: string; // e.g., 'contract', 'invoice', 'drawing', 'report'
  path: string; // Path or URL to access the file
  size?: number; // Optional, in bytes
  mimeType?: string; // Optional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  createdAt: string;
  createdBy?: string; // User ID or name
  updatedAt?: string;
  updatedBy?: string; // User ID or name
}

// Helper to map backend document data if necessary
// Assuming backend returns fields like property_id, mime_type, created_at, created_by etc.
const mapToFrontendDocument = (data: any): Document => {
  return {
    id: data.id,
    propertyId: data.property_id,
    name: data.name,
    type: data.type,
    path: data.path, // This might be a URL from the backend now
    size: data.size,
    mimeType: data.mime_type,
    metadata: data.metadata,
    createdAt: data.created_at,
    createdBy: data.created_by, // Could be a user ID, might need fetching user details elsewhere if name needed
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
};

export const loadDocuments = async (
  propertyId?: string, // Make propertyId optional for system-wide documents
  type?: string
): Promise<Document[]> => {
  // TODO: Define backend API: GET /api/documents?propertyId=X&type=Y
  // Or if propertyId is part of path: GET /api/properties/X/documents?type=Y
  let endpoint = '/api/documents';
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (type) params.append('type', type);
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await request<any[]>(endpoint, { method: 'GET' }); // Replace any[] with BackendDocument[]
    return data.map(mapToFrontendDocument);
  } catch (error) {
    console.error('Error loading documents via API:', error);
    return [];
  }
};

export const uploadDocument = async (
  file: File,
  propertyId?: string, // Optional propertyId
  type?: string, // Optional type, can be part of metadata or determined by backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
): Promise<Document | null> => {
  // TODO: Define backend API for file upload: POST /api/documents/upload or POST /api/documents
  // Backend will handle file storage (e.g., local disk, S3) and create DB record.
  const formData = new FormData();
  formData.append('file', file);
  if (propertyId) formData.append('propertyId', propertyId);
  if (type) formData.append('type', type);
  if (metadata) formData.append('metadata', JSON.stringify(metadata));

  try {
    // The `request` helper in apiClient.ts handles FormData correctly
    // by not setting Content-Type, allowing browser to set it with boundary.
    const data = await request<any>('/api/documents', { // Endpoint for uploads
      method: 'POST',
      body: formData,
    }); // Replace any with BackendDocument
    return mapToFrontendDocument(data);
  } catch (error) {
    console.error('Error uploading document via API:', error);
    return null;
  }
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/documents/${id}
  // Backend handles deleting file from storage and DB record.
  try {
    await request<void>(`/api/documents/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting document ${id} via API:`, error);
    return false;
  }
};

export const updateDocument = async (
  id: string,
  updates: DocumentUpdate
): Promise<Document | null> => {
  // TODO: Define backend API: PATCH /api/documents/${id}
  // Backend handles updatedBy, updatedAt.
  try {
    const data = await request<any>(`/api/documents/${id}`, { // Replace any with BackendDocument
      method: 'PATCH',
      body: updates,
    });
    return mapToFrontendDocument(data);
  } catch (error) {
    console.error(`Error updating document ${id} via API:`, error);
    return null; // Or throw error
  }
};

// TODO: Consider if a getDocumentById(id: string) function is needed.
// If so, it would call GET /api/documents/${id}

// TODO: Consider if a function to get a download URL for a document is needed.
// This might be part of the `Document` object (`path` could be a direct URL),
// or a separate API call: GET /api/documents/${id}/download-url