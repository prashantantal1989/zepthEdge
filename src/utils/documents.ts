import { supabase } from '../lib/supabase';

// Mock data for development
const mockDocuments: Document[] = [
  {
    id: 'm2n3o4p5-q6r7-8s9t-0u1v-w2x3y4z5a6b7',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Budget Proposal 2025.pdf',
    type: 'budget',
    path: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3/budget/budget_proposal_2025.pdf',
    size: 2457600,
    mimeType: 'application/pdf',
    metadata: { budgetId: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6' },
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'n3o4p5q6-r7s8-9t0u-1v2w-x3y4z5a6b7c8',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Lobby Renovation Plans.dwg',
    type: 'capex',
    path: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3/capex/lobby_renovation_plans.dwg',
    size: 5242880,
    mimeType: 'application/acad',
    metadata: { capexId: 'h7i8j9k0-l1m2-3n4o-5p6q-r7s8t9u0v1w2' },
    createdAt: '2024-02-10T14:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-02-10T14:45:00Z'
  },
  {
    id: 'o4p5q6r7-s8t9-0u1v-2w3x-y4z5a6b7c8d9',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    name: 'HVAC System Specifications.pdf',
    type: 'capex',
    path: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0/capex/hvac_system_specifications.pdf',
    size: 3145728,
    mimeType: 'application/pdf',
    metadata: { capexId: 'i8j9k0l1-m2n3-4o5p-6q7r-s8t9u0v1w2x3' },
    createdAt: '2024-01-25T16:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-01-25T16:30:00Z'
  }
];

export interface DocumentUpdate {
  name?: string;
  type?: string;
  metadata?: any;
}

export interface Document {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  path: string;
  size: number;
  mimeType: string;
  metadata?: any;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadDocuments = async (
  propertyId: string,
  type?: string
): Promise<Document[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredDocs = mockDocuments.filter(doc => doc.propertyId === propertyId);
      
      if (type) {
        filteredDocs = filteredDocs.filter(doc => doc.type === type);
      }
      
      return filteredDocs;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('documents')
      .select('*')
      .eq('property_id', propertyId);
  
    if (type) {
      query = query.eq('type', type);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      name: row.name,
      type: row.type,
      path: row.path,
      size: row.size,
      mimeType: row.mime_type,
      metadata: row.metadata,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

export const uploadDocument = async (
  propertyId: string,
  file: File,
  type: string,
  metadata?: any
): Promise<Document | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newDocument: Document = {
        id: crypto.randomUUID(),
        propertyId,
        name: file.name,
        type,
        path: `${propertyId}/${type}/${Date.now()}_${file.name}`,
        size: file.size,
        mimeType: file.type,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockDocuments.push(newDocument);
      return newDocument;
    }
    
    // In production, upload to Supabase Storage
    const filePath = `${propertyId}/${type}/${Date.now()}_${file.name}`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
  
    if (fileError) {
      console.error('Error uploading file:', fileError);
      return null;
    }
  
    // Then, create a document record in the database
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        property_id: propertyId,
        name: file.name,
        type,
        path: filePath,
        size: file.size,
        mime_type: file.type,
        metadata: metadata || {},
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating document record:', error);
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      name: data.name,
      type: data.type,
      path: data.path,
      size: data.size,
      mimeType: data.mime_type,
      metadata: data.metadata,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const initialLength = mockDocuments.length;
      mockDocuments = mockDocuments.filter(doc => doc.id !== id);
      return mockDocuments.length < initialLength;
    }
    
    // In production, delete from Supabase
    // First, get the document to find its path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('path')
      .eq('id', id)
      .single();
  
    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return false;
    }
  
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.path]);
  
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      return false;
    }
  
    // Delete the document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Error deleting document record:', error);
      return false;
    }
  
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

export const updateDocument = async (
  id: string,
  updates: DocumentUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating document:', error);
    return false;
  }

  return true;
};