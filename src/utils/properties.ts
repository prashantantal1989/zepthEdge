import { supabase } from '../lib/supabase';
import { Property, currencies } from '../types/property';

// Mock property data for development
const mockProperties: Property[] = [
  {
    id: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    name: 'Courtyard Marriott',
    location: 'New York, NY',
    address: '123 Broadway, New York, NY 10001',
    phone: '+1 (212) 555-1234',
    email: 'info@courtyardny.com',
    generalManager: 'Sarah Johnson',
    type: 'Hotel',
    rooms: 245,
    currency: currencies[0], // USD
    budgetUtilization: 68,
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    name: 'Hilton Garden Inn',
    location: 'Chicago, IL',
    address: '456 Michigan Ave, Chicago, IL 60611',
    phone: '+1 (312) 555-6789',
    email: 'info@hiltongarden.com',
    generalManager: 'Michael Chen',
    type: 'Hotel',
    rooms: 189,
    currency: currencies[0], // USD
    budgetUtilization: 75,
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2',
    name: 'Sheraton Downtown',
    location: 'Los Angeles, CA',
    address: '789 Figueroa St, Los Angeles, CA 90017',
    phone: '+1 (213) 555-4321',
    email: 'info@sheratonla.com',
    generalManager: 'Emily Parker',
    type: 'Hotel',
    rooms: 320,
    currency: currencies[0], // USD
    budgetUtilization: 42,
    image: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'd4c3b2a1-f6e5-4b5a-8d9c-7f6e5d4c3b2',
    name: 'Westin Resort',
    location: 'Miami, FL',
    address: '321 Ocean Drive, Miami, FL 33139',
    phone: '+1 (305) 555-8765',
    email: 'info@westinmiami.com',
    generalManager: 'David Wilson',
    type: 'Resort',
    rooms: 412,
    currency: currencies[0], // USD
    budgetUtilization: 89,
    image: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'e5d4c3b2-a1f6-4e5d-8c9b-7a6f5e4d3c2',
    name: 'Hyatt Regency',
    location: 'San Francisco, CA',
    address: '567 Market St, San Francisco, CA 94105',
    phone: '+1 (415) 555-2345',
    email: 'info@hyattsf.com',
    generalManager: 'Jennifer Lopez',
    type: 'Hotel',
    rooms: 275,
    currency: currencies[0], // USD
    budgetUtilization: 56,
    image: 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'b5a4c3d2-e1f6-4a5b-9c8d-7e6f5a4b3c2',
    name: 'Holiday Inn Express',
    location: 'Boston, MA',
    address: '890 Commonwealth Ave, Boston, MA 02215',
    phone: '+1 (617) 555-9876',
    email: 'info@holidayinnboston.com',
    generalManager: 'Robert Brown',
    type: 'Hotel',
    rooms: 156,
    currency: currencies[0], // USD
    budgetUtilization: 32,
    image: 'https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

/**
 * Load properties from Supabase
 */
export const loadProperties = async (): Promise<Property[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      return mockProperties;
    }

    // In production, fetch from Supabase
    const { data, error } = await supabase
      .from('properties')
      .select('*');

    if (error) {
      console.error('Error loading properties:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      address: row.address,
      phone: row.phone || '',
      email: row.email || '',
      generalManager: row.general_manager || '',
      type: row.type,
      rooms: row.rooms,
      currency: {
        code: row.currency_code,
        symbol: row.currency_symbol,
        name: row.currency_name
      },
      budgetUtilization: row.budget_utilization || 0,
      image: row.image_url || 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    }));
  } catch (error) {
    console.error('Error loading properties:', error);
    return [];
  }
};

/**
 * Get a property by ID
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const property = mockProperties.find(p => p.id === id);
      return property || null;
    }

    // In production, fetch from Supabase
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting property:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      location: data.location,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      generalManager: data.general_manager || '',
      type: data.type,
      rooms: data.rooms,
      currency: {
        code: data.currency_code,
        symbol: data.currency_symbol,
        name: data.currency_name
      },
      budgetUtilization: data.budget_utilization || 0,
      image: data.image_url || 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    };
  } catch (error) {
    console.error('Error getting property:', error);
    return null;
  }
};

/**
 * Save a new property
 * In development mode, adds to mockProperties array
 * In production, saves to Supabase
 */
export const saveProperty = async (property: Omit<Property, 'id'>): Promise<Property | null> => {
  // In development mode, create a mock property
  if (import.meta.env.DEV) {
    const newProperty: Property = {
      ...property,
      id: crypto.randomUUID(),
      budgetUtilization: 0
    };
    
    mockProperties.push(newProperty);
    return newProperty;
  }

  // In production, save to Supabase
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        name: property.name,
        location: property.location,
        address: property.address,
        phone: property.phone,
        email: property.email,
        general_manager: property.generalManager,
        type: property.type,
        rooms: property.rooms,
        currency_code: property.currency.code,
        currency_symbol: property.currency.symbol,
        currency_name: property.currency.name,
        image_url: property.image
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving property:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      location: data.location,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      generalManager: data.general_manager || '',
      type: data.type,
      rooms: data.rooms,
      currency: {
        code: data.currency_code,
        symbol: data.currency_symbol,
        name: data.currency_name
      },
      budgetUtilization: data.budget_utilization || 0,
      image: data.image_url || ''
    };
  } catch (error) {
    console.error('Error saving property:', error);
    return null;
  }
};