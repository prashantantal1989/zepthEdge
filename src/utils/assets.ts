import { supabase } from '../lib/supabase';

export interface Asset {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  category: string;
  tagId?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  currentValue?: number;
  location?: string;
  status: 'active' | 'maintenance' | 'disposed' | 'transferred';
  condition?: 'new' | 'good' | 'fair' | 'poor';
  warrantyExpiry?: string;
  manufacturer?: string;
  model?: string;
  supplier?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  propertyId: string;
  maintenanceType: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  performedBy?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  fromPropertyId: string;
  toPropertyId: string;
  transferDate: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

// Mock data for development
const mockAssets: Asset[] = [
  {
    id: 'a7b8c9d0-e1f2-3g4h-5i6j-7k8l9m0n1o2',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Lobby Sofa',
    type: 'Furniture',
    category: 'Sofa',
    tagId: 'FUR-001',
    serialNumber: 'SN12345',
    purchaseDate: '2023-01-15',
    purchaseCost: 2500,
    currentValue: 2000,
    location: 'Main Lobby',
    status: 'active',
    condition: 'good',
    warrantyExpiry: '2026-01-15',
    manufacturer: 'Luxury Furnishings',
    model: 'Comfort Plus',
    supplier: 'Hotel Supplies Inc.',
    notes: 'Premium leather sofa for main lobby area',
    createdAt: '2023-01-20T10:30:00Z',
    updatedAt: '2023-01-20T10:30:00Z'
  },
  {
    id: 'b8c9d0e1-f2g3-4h5i-6j7k-8l9m0n1o2p3',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Reception Computer',
    type: 'Electronics',
    category: 'Computer',
    tagId: 'ELE-001',
    serialNumber: 'DELL78901',
    purchaseDate: '2023-02-10',
    purchaseCost: 1200,
    currentValue: 900,
    location: 'Front Desk',
    status: 'active',
    condition: 'good',
    warrantyExpiry: '2026-02-10',
    manufacturer: 'Dell',
    model: 'OptiPlex 7090',
    supplier: 'Tech Solutions Ltd.',
    notes: 'Front desk check-in computer',
    createdAt: '2023-02-15T14:20:00Z',
    updatedAt: '2023-02-15T14:20:00Z'
  },
  {
    id: 'c9d0e1f2-g3h4-5i6j-7k8l-9m0n1o2p3q4',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Lobby Chandelier',
    type: 'Fixture',
    category: 'Lighting',
    tagId: 'FIX-001',
    purchaseDate: '2022-11-05',
    purchaseCost: 5000,
    currentValue: 4500,
    location: 'Main Lobby',
    status: 'active',
    condition: 'new',
    manufacturer: 'Elegant Lighting',
    model: 'Crystal Cascade',
    supplier: 'Luxury Decor Inc.',
    notes: 'Custom crystal chandelier for main lobby',
    createdAt: '2022-11-10T09:15:00Z',
    updatedAt: '2022-11-10T09:15:00Z'
  },
  {
    id: 'd0e1f2g3-h4i5-6j7k-8l9m-0n1o2p3q4r5',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Commercial Dishwasher',
    type: 'Appliance',
    category: 'Kitchen',
    tagId: 'APP-001',
    serialNumber: 'HOBART123456',
    purchaseDate: '2023-03-20',
    purchaseCost: 8500,
    currentValue: 7800,
    location: 'Main Kitchen',
    status: 'maintenance',
    condition: 'fair',
    warrantyExpiry: '2025-03-20',
    manufacturer: 'Hobart',
    model: 'AM15-6',
    supplier: 'Restaurant Supply Co.',
    notes: 'High-capacity commercial dishwasher, scheduled for maintenance check',
    createdAt: '2023-03-25T11:45:00Z',
    updatedAt: '2023-05-10T16:30:00Z'
  },
  {
    id: 'e1f2g3h4-i5j6-7k8l-9m0n-1o2p3q4r5s6',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Conference Room Projector',
    type: 'Electronics',
    category: 'Projector',
    tagId: 'ELE-002',
    serialNumber: 'EPSON567890',
    purchaseDate: '2023-04-05',
    purchaseCost: 1800,
    currentValue: 1600,
    location: 'Grand Ballroom',
    status: 'active',
    condition: 'good',
    warrantyExpiry: '2025-04-05',
    manufacturer: 'Epson',
    model: 'PowerLite 1795F',
    supplier: 'AV Solutions Inc.',
    notes: 'Full HD wireless projector for conference room',
    createdAt: '2023-04-10T13:20:00Z',
    updatedAt: '2023-04-10T13:20:00Z'
  },
  {
    id: 'f2g3h4i5-j6k7-8l9m-0n1o-2p3q4r5s6t7',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    name: 'Pool Lounge Chairs',
    type: 'Furniture',
    category: 'Chair',
    tagId: 'FUR-002',
    purchaseDate: '2023-05-15',
    purchaseCost: 3600,
    currentValue: 3400,
    location: 'Pool Deck',
    status: 'active',
    condition: 'good',
    manufacturer: 'Outdoor Elegance',
    model: 'Sunlounger Pro',
    supplier: 'Resort Furnishings',
    notes: 'Set of 6 weather-resistant pool lounge chairs',
    createdAt: '2023-05-20T10:00:00Z',
    updatedAt: '2023-05-20T10:00:00Z'
  }
];

const mockMaintenanceRecords: AssetMaintenance[] = [
  {
    id: 'g3h4i5j6-k7l8-9m0n-1o2p-3q4r5s6t7u8',
    assetId: 'd0e1f2g3-h4i5-6j7k-8l9m-0n1o2p3q4r5',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    maintenanceType: 'Preventive',
    description: 'Regular maintenance check for commercial dishwasher',
    scheduledDate: '2023-06-15',
    status: 'scheduled',
    createdAt: '2023-05-10T16:30:00Z',
    updatedAt: '2023-05-10T16:30:00Z'
  },
  {
    id: 'h4i5j6k7-l8m9-0n1o-2p3q-4r5s6t7u8v9',
    assetId: 'd0e1f2g3-h4i5-6j7k-8l9m-0n1o2p3q4r5',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    maintenanceType: 'Repair',
    description: 'Fix water leak in dishwasher',
    scheduledDate: '2023-04-10',
    completedDate: '2023-04-12',
    cost: 350,
    performedBy: 'John Smith - Appliance Repair',
    status: 'completed',
    notes: 'Replaced water inlet valve and tested operation',
    createdAt: '2023-04-08T09:15:00Z',
    updatedAt: '2023-04-12T14:30:00Z'
  }
];

/**
 * Load assets for a property
 */
export const loadAssets = async (
  propertyId: string,
  filters?: {
    type?: string;
    category?: string;
    status?: 'active' | 'maintenance' | 'disposed' | 'transferred';
    search?: string;
  }
): Promise<Asset[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredAssets = mockAssets.filter(asset => asset.propertyId === propertyId);
      
      // Apply filters
      if (filters) {
        if (filters.type) {
          filteredAssets = filteredAssets.filter(asset => asset.type === filters.type);
        }
        if (filters.category) {
          filteredAssets = filteredAssets.filter(asset => asset.category === filters.category);
        }
        if (filters.status) {
          filteredAssets = filteredAssets.filter(asset => asset.status === filters.status);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filteredAssets = filteredAssets.filter(asset => 
            asset.name.toLowerCase().includes(search) ||
            asset.tagId?.toLowerCase().includes(search) ||
            asset.serialNumber?.toLowerCase().includes(search)
          );
        }
      }
      
      return filteredAssets;
    }

    // In production, fetch from Supabase
    let query = supabase
      .from('assets')
      .select('*')
      .eq('property_id', propertyId);

    // Apply filters
    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,tag_id.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error loading assets:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      name: row.name,
      type: row.type,
      category: row.category,
      tagId: row.tag_id,
      serialNumber: row.serial_number,
      purchaseDate: row.purchase_date,
      purchaseCost: row.purchase_cost,
      currentValue: row.current_value,
      location: row.location,
      status: row.status,
      condition: row.condition,
      warrantyExpiry: row.warranty_expiry,
      manufacturer: row.manufacturer,
      model: row.model,
      supplier: row.supplier,
      notes: row.notes,
      metadata: row.metadata,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading assets:', error);
    return [];
  }
};

/**
 * Create a new asset
 */
export const createAsset = async (
  asset: Omit<Asset, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Asset | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newAsset = {
        ...asset,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Asset;
      mockAssets.push(newAsset);
      return newAsset;
    }

    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('assets')
      .insert([{
        property_id: asset.propertyId,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        tag_id: asset.tagId,
        serial_number: asset.serialNumber,
        purchase_date: asset.purchaseDate,
        purchase_cost: asset.purchaseCost,
        current_value: asset.currentValue,
        location: asset.location,
        status: asset.status,
        condition: asset.condition,
        warranty_expiry: asset.warrantyExpiry,
        manufacturer: asset.manufacturer,
        model: asset.model,
        supplier: asset.supplier,
        notes: asset.notes,
        metadata: asset.metadata
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating asset:', error);
      return null;
    }

    return {
      id: data.id,
      propertyId: data.property_id,
      name: data.name,
      type: data.type,
      category: data.category,
      tagId: data.tag_id,
      serialNumber: data.serial_number,
      purchaseDate: data.purchase_date,
      purchaseCost: data.purchase_cost,
      currentValue: data.current_value,
      location: data.location,
      status: data.status,
      condition: data.condition,
      warrantyExpiry: data.warranty_expiry,
      manufacturer: data.manufacturer,
      model: data.model,
      supplier: data.supplier,
      notes: data.notes,
      metadata: data.metadata,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating asset:', error);
    return null;
  }
};

/**
 * Load maintenance records for an asset
 */
export const loadAssetMaintenance = async (
  assetId: string,
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
): Promise<AssetMaintenance[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredRecords = mockMaintenanceRecords.filter(record => record.assetId === assetId);
      
      if (status) {
        filteredRecords = filteredRecords.filter(record => record.status === status);
      }
      
      return filteredRecords;
    }

    // In production, fetch from Supabase
    let query = supabase
      .from('asset_maintenance')
      .select('*')
      .eq('asset_id', assetId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Error loading asset maintenance records:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      assetId: row.asset_id,
      propertyId: row.property_id,
      maintenanceType: row.maintenance_type,
      description: row.description,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date,
      cost: row.cost,
      performedBy: row.performed_by,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading asset maintenance records:', error);
    return [];
  }
};

/**
 * Create a maintenance record for an asset
 */
export const createAssetMaintenance = async (
  maintenance: Omit<AssetMaintenance, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<AssetMaintenance | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newMaintenance: AssetMaintenance = {
        ...maintenance,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockMaintenanceRecords.push(newMaintenance);
      return newMaintenance;
    }

    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert([{
        asset_id: maintenance.assetId,
        property_id: maintenance.propertyId,
        maintenance_type: maintenance.maintenanceType,
        description: maintenance.description,
        scheduled_date: maintenance.scheduledDate,
        completed_date: maintenance.completedDate,
        cost: maintenance.cost,
        performed_by: maintenance.performedBy,
        status: maintenance.status,
        notes: maintenance.notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating asset maintenance record:', error);
      return null;
    }

    return {
      id: data.id,
      assetId: data.asset_id,
      propertyId: data.property_id,
      maintenanceType: data.maintenance_type,
      description: data.description,
      scheduledDate: data.scheduled_date,
      completedDate: data.completed_date,
      cost: data.cost,
      performedBy: data.performed_by,
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating asset maintenance record:', error);
    return null;
  }
};