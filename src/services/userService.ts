import { supabase } from '../lib/supabase';
import { User } from '../types/user';

/**
 * User Management Service
 * 
 * This service provides methods for managing users in the application.
 * It handles authentication, user profile management, and property assignments.
 */
export class UserService {
  /**
   * Get all users
   */
  static async getAllUsers(): Promise<User[]> {
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
      return [];
    }

    // Then get property assignments for all users
    const { data: propertyUsers, error: propertyUsersError } = await supabase
      .from('property_users')
      .select(`
        user_id,
        properties:property_id (
          id,
          name
        )
      `);

    if (propertyUsersError) {
      console.error('Error loading property assignments:', propertyUsersError);
      return [];
    }

    // Group property assignments by user
    const userProperties = propertyUsers.reduce((acc, pu) => {
      if (!acc[pu.user_id]) {
        acc[pu.user_id] = [];
      }
      if (pu.properties?.name) {
        acc[pu.user_id].push(pu.properties.name);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Map profiles to users with their properties
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.full_name || 'Unknown',
      role: profile.role || 'viewer',
      properties: userProperties[profile.id] || [],
      status: 'active',
      avatar: profile.avatar_url
    }));
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) {
      console.error('Error loading profile:', profileError);
      return null;
    }

    // Get property assignments
    const { data: propertyUsers, error: propertyUsersError } = await supabase
      .from('property_users')
      .select(`
        properties:property_id (
          id,
          name
        )
      `)
      .eq('user_id', id);

    if (propertyUsersError) {
      console.error('Error loading property assignments:', propertyUsersError);
      return null;
    }

    const userProperties = propertyUsers
      .map(pu => pu.properties?.name)
      .filter(Boolean) as string[];

    return {
      id: profile.id,
      name: profile.full_name || 'Unknown',
      role: profile.role || 'viewer',
      properties: userProperties,
      status: 'active',
      avatar: profile.avatar_url,
      dateJoined: profile.created_at,
      recentActivity: []
    };
  }

  /**
   * Get all users for a property
   */
  static async getPropertyUsers(propertyId: string): Promise<User[]> {
    const { data: propertyUsers, error } = await supabase
      .from('property_users')
      .select(`
        role,
        user_id,
        profiles:users!inner(
          id,
          full_name,
          role,
          avatar_url
        )
      `)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error loading property users:', error);
      return [];
    }

    return propertyUsers.map(pu => ({
      id: pu.user_id,
      name: pu.profiles.full_name || 'Unknown',
      role: pu.role,
      properties: [],
      status: 'active',
      avatar: pu.profiles.avatar_url
    }));
  }

  /**
   * Add a user to a property
   */
  static async addUserToProperty(
    propertyId: string,
    userId: string,
    role: 'admin' | 'manager' | 'finance' | 'viewer'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('property_users')
      .insert([{
        property_id: propertyId,
        user_id: userId,
        role
      }]);

    if (error) {
      console.error('Error adding user to property:', error);
      return false;
    }

    return true;
  }

  /**
   * Remove a user from a property
   */
  static async removeUserFromProperty(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('property_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing user from property:', error);
      return false;
    }

    return true;
  }

  /**
   * Update a user's role in a property
   */
  static async updateUserPropertyRole(
    id: string,
    role: 'admin' | 'manager' | 'finance' | 'viewer'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('property_users')
      .update({ role })
      .eq('id', id);

    if (error) {
      console.error('Error updating user property role:', error);
      return false;
    }

    return true;
  }
}