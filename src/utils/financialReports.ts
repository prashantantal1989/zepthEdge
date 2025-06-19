import { supabase } from '../lib/supabase';

// Mock data for development
const mockFinancialReports: FinancialReport[] = [
  {
    id: 'p5q6r7s8-t9u0-1v2w-3x4y-z5a6b7c8d9e0',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    type: 'monthly',
    date: '2024-03-01',
    data: [
      { department: 'Rooms', revenue: 450000, expenses: 180000, profit: 270000 },
      { department: 'F&B', revenue: 220000, expenses: 150000, profit: 70000 },
      { department: 'Spa', revenue: 85000, expenses: 45000, profit: 40000 },
      { department: 'Other', revenue: 35000, expenses: 15000, profit: 20000 }
    ],
    createdAt: '2024-04-05T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-05T10:30:00Z'
  },
  {
    id: 'q6r7s8t9-u0v1-2w3x-4y5z-a6b7c8d9e0f1',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    type: 'monthly',
    date: '2024-02-01',
    data: [
      { department: 'Rooms', revenue: 420000, expenses: 175000, profit: 245000 },
      { department: 'F&B', revenue: 200000, expenses: 140000, profit: 60000 },
      { department: 'Spa', revenue: 75000, expenses: 42000, profit: 33000 },
      { department: 'Other', revenue: 30000, expenses: 14000, profit: 16000 }
    ],
    createdAt: '2024-03-05T11:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-03-05T11:15:00Z'
  },
  {
    id: 'r7s8t9u0-v1w2-3x4y-5z6a-b7c8d9e0f1g2',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    type: 'monthly',
    date: '2024-03-01',
    data: [
      { department: 'Rooms', revenue: 380000, expenses: 160000, profit: 220000 },
      { department: 'F&B', revenue: 180000, expenses: 130000, profit: 50000 },
      { department: 'Spa', revenue: 65000, expenses: 40000, profit: 25000 },
      { department: 'Other', revenue: 25000, expenses: 12000, profit: 13000 }
    ],
    createdAt: '2024-04-03T09:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-03T09:45:00Z'
  }
];

export interface FinancialReport {
  id: string;
  propertyId: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  data: any[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadFinancialReports = async (
  propertyId: string,
  type: 'daily' | 'weekly' | 'monthly',
  startDate?: string,
  endDate?: string
): Promise<FinancialReport[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredReports = mockFinancialReports.filter(
        report => report.propertyId === propertyId && report.type === type
      );
      
      if (startDate) {
        filteredReports = filteredReports.filter(report => report.date >= startDate);
      }
      
      if (endDate) {
        filteredReports = filteredReports.filter(report => report.date <= endDate);
      }
      
      return filteredReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('financial_reports')
      .select('*')
      .eq('property_id', propertyId)
      .eq('type', type);
  
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
  
    const { data, error } = await query.order('date', { ascending: false });
  
    if (error) {
      console.error('Error loading financial reports:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      type: row.type,
      date: row.date,
      data: row.data,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading financial reports:', error);
    return [];
  }
};

export const uploadFinancialReport = async (
  propertyId: string,
  type: 'daily' | 'weekly' | 'monthly',
  date: string,
  data: any[]
): Promise<FinancialReport | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newReport: FinancialReport = {
        id: crypto.randomUUID(),
        propertyId,
        type,
        date,
        data,
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockFinancialReports.push(newReport);
      return newReport;
    }
    
    // In production, insert into Supabase
    const { data: report, error } = await supabase
      .from('financial_reports')
      .insert([{
        property_id: propertyId,
        type,
        date,
        data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error uploading financial report:', error);
      return null;
    }
  
    return {
      id: report.id,
      propertyId: report.property_id,
      type: report.type,
      date: report.date,
      data: report.data,
      createdAt: report.created_at,
      createdBy: report.created_by,
      updatedAt: report.updated_at,
      updatedBy: report.updated_by
    };
  } catch (error) {
    console.error('Error uploading financial report:', error);
    return null;
  }
};