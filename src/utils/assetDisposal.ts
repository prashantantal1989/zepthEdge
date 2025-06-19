import { supabase } from '../lib/supabase';

// Mock data for development
const mockAssetDisposals: AssetDisposal[] = [
  {
    id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    assetType: 'Furniture',
    assetDescription: 'Damaged lobby sofa',
    assetTagId: 'FUR-001',
    netBookValue: 1500,
    disposableValue: 300,
    quantity: 1,
    vendor: 'Hotel Supplies Inc.',
    reason: 'Damaged beyond repair',
    status: 'pending',
    workflowId: 'w1x2y3z4-a5b6-7c8d-9e0f-g1h2i3j4k5l6',
    currentStep: 1,
    createdAt: '2023-05-15T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2023-05-15T10:30:00Z'
  },
  {
    id: 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    assetType: 'Electronics',
    assetDescription: 'Outdated TVs',
    assetTagId: 'ELE-005',
    netBookValue: 3000,
    disposableValue: 800,
    quantity: 5,
    vendor: 'Tech Recyclers Ltd.',
    reason: 'Upgrading to newer models',
    status: 'approved',
    workflowId: 'x2y3z4a5-b6c7-8d9e-0f1g-h2i3j4k5l6m7',
    currentStep: 3,
    createdAt: '2023-04-20T14:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2023-04-25T09:45:00Z'
  }
];

export interface AssetDisposalUpdate {
  assetType?: string;
  assetDescription?: string;
  assetTagId?: string;
  netBookValue?: number;
  disposableValue?: number;
  quantity?: number;
  vendor?: string;
  reason?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  currentStep?: number;
}

export interface AssetDisposal {
  id: string;
  propertyId: string;
  assetType: string;
  assetDescription: string;
  assetTagId: string;
  netBookValue: number;
  disposableValue: number;
  quantity: number;
  vendor: string;
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  workflowId: string;
  currentStep: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadAssetDisposals = async (
  propertyId: string,
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
): Promise<AssetDisposal[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredDisposals = mockAssetDisposals.filter(disposal => disposal.propertyId === propertyId);
      
      if (status) {
        filteredDisposals = filteredDisposals.filter(disposal => disposal.status === status);
      }
      
      return filteredDisposals;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('asset_disposals')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading asset disposals:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      assetType: row.asset_type,
      assetDescription: row.asset_description,
      assetTagId: row.asset_tag_id,
      netBookValue: row.net_book_value,
      disposableValue: row.disposable_value,
      quantity: row.quantity,
      vendor: row.vendor,
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
    console.error('Error loading asset disposals:', error);
    return [];
  }
};

export const createAssetDisposal = async (
  disposal: Omit<AssetDisposal, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<AssetDisposal | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newDisposal: AssetDisposal = {
        ...disposal,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockAssetDisposals.push(newDisposal);
      return newDisposal;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('asset_disposals')
      .insert([{
        property_id: disposal.propertyId,
        asset_type: disposal.assetType,
        asset_description: disposal.assetDescription,
        asset_tag_id: disposal.assetTagId,
        net_book_value: disposal.netBookValue,
        disposable_value: disposal.disposableValue,
        quantity: disposal.quantity,
        vendor: disposal.vendor,
        reason: disposal.reason,
        status: disposal.status,
        workflow_id: disposal.workflowId,
        current_step: disposal.currentStep,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating asset disposal:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      assetType: data.asset_type,
      assetDescription: data.asset_description,
      assetTagId: data.asset_tag_id,
      netBookValue: data.net_book_value,
      disposableValue: data.disposable_value,
      quantity: data.quantity,
      vendor: data.vendor,
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
    console.error('Error creating asset disposal:', error);
    return null;
  }
};

export const updateAssetDisposal = async (
  id: string,
  updates: AssetDisposalUpdate
): Promise<boolean> => {
  const { error } = await supabase
    .from('asset_disposals')
    .update({
      asset_type: updates.assetType,
      asset_description: updates.assetDescription,
      asset_tag_id: updates.assetTagId,
      net_book_value: updates.netBookValue,
      disposable_value: updates.disposableValue,
      quantity: updates.quantity,
      vendor: updates.vendor,
      reason: updates.reason,
      status: updates.status,
      current_step: updates.currentStep,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating asset disposal:', error);
    return false;
  }

  return true;
};

export const deleteAssetDisposal = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('asset_disposals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset disposal:', error);
    return false;
  }

  return true;
};