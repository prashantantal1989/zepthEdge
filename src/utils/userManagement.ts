import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export interface Profile {
  id: string;
  fullName: string | null;
  role: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PropertyUser {
  id: string;
  propertyId: string;
  userId: string;
  role: 'admin' | 'manager' | 'finance' | 'viewer';
  createdAt: string;
}

/**
 * Load all users with their profiles
 */
export const loadUsers = async (): Promise<User[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        role: 'Admin',
        properties: ['Courtyard Marriott', 'Hilton Garden Inn'],
        status: 'active',
        lastLogin: '2025-04-15 09:30 AM',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.c@example.com',
        role: 'Property Manager',
        properties: ['Sheraton Downtown'],
        status: 'active',
        lastLogin: '2025-04-15 10:15 AM'
      },
      {
        id: '3',
        name: 'Emily Parker',
        email: 'emily.p@example.com',
        role: 'Finance Manager',
        properties: ['Westin Resort', 'Holiday Inn Express'],
        status: 'pending',
        lastLogin: 'Never'
      },
      {
        id: '4',
        name: 'David Wilson',
        email: 'david.w@example.com',
        role: 'Viewer',
        properties: ['Hyatt Regency'],
        status: 'inactive',
        lastLogin: '2025-04-10 02:45 PM'
      }
    ];
  }

  // In production, fetch from Supabase
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Error loading profiles:', profilesError);
    return [];
  }

  // Get all users from auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error loading auth users:', authError);
    return [];
  }

  // Get property assignments for all users
  const { data: propertyUsers, error: propertyError } = await supabase
    .from('property_users')
    .select(`
      *,
      properties:property_id (
        id,
        name
      )
    `);

  if (propertyError) {
    console.error('Error loading property users:', propertyError);
    return [];
  }

  // Map profiles to users
  return profiles.map(profile => {
    const authUser = authUsers.users.find(u => u.id === profile.id);
    const userProperties = propertyUsers
      .filter(pu => pu.user_id === profile.id)
      .map(pu => pu.properties.name);

    return {
      id: profile.id,
      name: profile.full_name || 'Unknown',
      email: authUser?.email || '',
      role: profile.role || 'Viewer',
      properties: userProperties,
      status: authUser?.banned ? 'inactive' : authUser?.confirmed_at ? 'active' : 'pending',
      lastLogin: authUser?.last_sign_in_at || 'Never',
      avatar: profile.avatar_url
    };
  });
};

/**
 * Get a user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    const mockUsers = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        role: 'Admin',
        properties: ['Courtyard Marriott', 'Hilton Garden Inn'],
        status: 'active',
        lastLogin: '2025-04-15 09:30 AM',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2',
        department: 'Operations',
        phone: '+1 (555) 123-4567',
        dateJoined: '2024-01-15',
        recentActivity: [
          {
            action: 'Approved budget request',
            date: '2025-04-15 09:30 AM',
            property: 'Courtyard Marriott'
          },
          {
            action: 'Created new CAPEX request',
            date: '2025-04-14 02:15 PM',
            property: 'Hilton Garden Inn'
          }
        ]
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.c@example.com',
        role: 'Property Manager',
        properties: ['Sheraton Downtown'],
        status: 'active',
        lastLogin: '2025-04-15 10:15 AM',
        department: 'Property Management',
        phone: '+1 (555) 234-5678',
        dateJoined: '2024-02-01'
      }
    ];
    return mockUsers.find(u => u.id === id) || null;
  }

  // In production, fetch from Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError) {
    console.error('Error loading profile:', profileError);
    return null;
  }

  // Get user from auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
  
  if (authError) {
    console.error('Error loading auth user:', authError);
    return null;
  }

  // Get property assignments for the user
  const { data: propertyUsers, error: propertyError } = await supabase
    .from('property_users')
    .select(`
      *,
      properties:property_id (
        id,
        name
      )
    `)
    .eq('user_id', id);

  if (propertyError) {
    console.error('Error loading property users:', propertyError);
    return null;
  }

  // Get recent activity (this would be a more complex query in a real app)
  const recentActivity = [];

  return {
    id: profile.id,
    name: profile.full_name || 'Unknown',
    email: authUser.user?.email || '',
    role: profile.role || 'Viewer',
    properties: propertyUsers.map(pu => pu.properties.name),
    status: authUser.user?.banned ? 'inactive' : authUser.user?.confirmed_at ? 'active' : 'pending',
    lastLogin: authUser.user?.last_sign_in_at || 'Never',
    avatar: profile.avatar_url,
    dateJoined: profile.created_at,
    recentActivity
  };
};

/**
 * Create a new user
 */
export const createUser = async (
  email: string,
  password: string,
  userData: {
    fullName: string;
    role: string;
    properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
  }
): Promise<User | null> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return {
      id: crypto.randomUUID(),
      name: userData.fullName,
      email,
      role: userData.role,
      properties: userData.properties?.map(() => 'Property Name') || [],
      status: 'pending',
      lastLogin: 'Never'
    };
  }

  // In production, create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: userData.fullName
    }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return null;
  }

  const userId = authData.user.id;

  // Update profile with role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: userData.role })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return null;
  }

  // Assign properties if provided
  if (userData.properties && userData.properties.length > 0) {
    const propertyAssignments = userData.properties.map(p => ({
      property_id: p.id,
      user_id: userId,
      role: p.role
    }));

    const { error: propertyError } = await supabase
      .from('property_users')
      .insert(propertyAssignments);

    if (propertyError) {
      console.error('Error assigning properties:', propertyError);
    }
  }

  return {
    id: userId,
    name: userData.fullName,
    email,
    role: userData.role,
    properties: [],
    status: 'pending',
    lastLogin: 'Never'
  };
};

/**
 * Update a user
 */
export const updateUser = async (
  id: string,
  userData: {
    fullName?: string;
    role?: string;
    properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
  }
): Promise<boolean> => {
  // In development mode, return success
  if (import.meta.env.DEV) {
    return true;
  }

  // Update profile
  const updates: any = {};
  if (userData.fullName) updates.full_name = userData.fullName;
  if (userData.role) updates.role = userData.role;

  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return false;
    }
  }

  // Update property assignments if provided
  if (userData.properties) {
    // First, remove all existing assignments
    const { error: deleteError } = await supabase
      .from('property_users')
      .delete()
      .eq('user_id', id);

    if (deleteError) {
      console.error('Error removing property assignments:', deleteError);
      return false;
    }

    // Then, add new assignments
    if (userData.properties.length > 0) {
      const propertyAssignments = userData.properties.map(p => ({
        property_id: p.id,
        user_id: id,
        role: p.role
      }));

      const { error: insertError } = await supabase
        .from('property_users')
        .insert(propertyAssignments);

      if (insertError) {
        console.error('Error adding property assignments:', insertError);
        return false;
      }
    }
  }

  return true;
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  // In development mode, return success
  if (import.meta.env.DEV) {
    return true;
  }

  // Delete user from auth.users (this will cascade to profiles and property_users)
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }

  return true;
};

/**
 * Get all property users for a property
 */
export const getPropertyUsers = async (propertyId: string): Promise<PropertyUser[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: '1',
        propertyId,
        userId: '1',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        propertyId,
        userId: '2',
        role: 'manager',
        createdAt: '2025-01-02T00:00:00Z'
      }
    ];
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('property_users')
    .select('*')
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error loading property users:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    propertyId: row.property_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at
  }));
};

/**
 * Add a user to a property
 */
export const addUserToProperty = async (
  propertyId: string,
  userId: string,
  role: 'admin' | 'manager' | 'finance' | 'viewer'
): Promise<PropertyUser | null> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return {
      id: crypto.randomUUID(),
      propertyId,
      userId,
      role,
      createdAt: new Date().toISOString()
    };
  }

  // In production, insert into Supabase
  const { data, error } = await supabase
    .from('property_users')
    .insert([{
      property_id: propertyId,
      user_id: userId,
      role
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding user to property:', error);
    return null;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    userId: data.user_id,
    role: data.role,
    createdAt: data.created_at
  };
};

/**
 * Remove a user from a property
 */
export const removeUserFromProperty = async (id: string): Promise<boolean> => {
  // In development mode, return success
  if (import.meta.env.DEV) {
    return true;
  }

  // In production, delete from Supabase
  const { error } = await supabase
    .from('property_users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing user from property:', error);
    return false;
  }

  return true;
};

/**
 * Update a user's role in a property
 */
export const updateUserPropertyRole = async (
  id: string,
  role: 'admin' | 'manager' | 'finance' | 'viewer'
): Promise<boolean> => {
  // In development mode, return success
  if (import.meta.env.DEV) {
    return true;
  }

  // In production, update in Supabase
  const { error } = await supabase
    .from('property_users')
    .update({ role })
    .eq('id', id);

  if (error) {
    console.error('Error updating user property role:', error);
    return false;
  }

  return true;
};