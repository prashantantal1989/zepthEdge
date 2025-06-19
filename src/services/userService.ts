import { request } from '../lib/apiClient';
import { User, UserRole, PropertyUser } from '../types/user';

// Interfaces for data shapes returned by the backend API
// These might need further refinement based on actual backend responses.
interface BackendUserWithProperties {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  global_role?: UserRole; // Role from the main 'users' table
  properties: Array<{ // Properties the user is associated with
    property_id: string;
    property_name: string;
    property_role: UserRole; // User's role specific to this property
  }>;
  created_at?: string;
}

interface BackendUserSimple { // For user info without full property details list
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  global_role?: UserRole;
  created_at?: string;
}

interface BackendPropertyUserAssignment { // For users listed under a specific property
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  assignment_id: string; // The ID of the property_users record
  property_role: UserRole; // Role on this specific property
  assigned_at?: string; // created_at from property_users
}

// Interface for the POST response when adding user to property
interface BackendPropertyUserAssignmentResult {
    id: string; // assignment_id
    property_id: string;
    user_id: string;
    role: UserRole;
    created_at: string;
}


export class UserService {
  /**
   * Get all users with their property associations.
   * The backend /api/users is expected to return this structure.
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const data = await request<BackendUserWithProperties[]>('/api/users', { method: 'GET' });
      return data.map(beUser => ({
        id: beUser.id,
        email: beUser.email,
        name: beUser.full_name || 'N/A',
        avatar: beUser.avatar_url || '',
        role: beUser.global_role || UserRole.VIEWER,
        // Assuming User type's 'properties' is string[] of names.
        // The backend provides more details, so we adapt.
        properties: beUser.properties?.map(p => p.property_name) || [],
        status: 'active', // Or determine from backend data if available
        dateJoined: beUser.created_at, // Assuming User type has dateJoined
        // recentActivity: [], // Placeholder if User type needs it
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID.
   * The backend /api/users/:id returns BackendUserWithProperties.
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const data = await request<BackendUserWithProperties>(`/api/users/${id}`, { method: 'GET' });
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.full_name || 'N/A',
        avatar: data.avatar_url || '',
        role: data.global_role || UserRole.VIEWER,
        properties: data.properties?.map(p => p.property_name) || [],
        status: 'active',
        dateJoined: data.created_at,
        // recentActivity: [],
      };
    } catch (error: any) {
      if (error.status === 404) return null;
      console.error(`Error fetching user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all users assigned to a specific property.
   * Backend /api/properties/:propertyId/users returns BackendPropertyUserAssignment[].
   */
  static async getPropertyUsers(propertyId: string): Promise<PropertyUser[]> {
    try {
      const data = await request<BackendPropertyUserAssignment[]>(`/api/properties/${propertyId}/users`, { method: 'GET' });
      return data.map(bpUser => ({
        assignmentId: bpUser.assignment_id,
        userId: bpUser.user_id,
        propertyId: propertyId,
        role: bpUser.property_role,
        userFullName: bpUser.full_name || 'N/A',
        userEmail: bpUser.email,
        userAvatarUrl: bpUser.avatar_url || '',
        // assigned_at: bpUser.assigned_at, // If PropertyUser type needs this
      }));
    } catch (error) {
      console.error(`Error fetching users for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Add a user to a property with a specific role.
   * Backend POST /api/properties/:propertyId/users returns the created property_users record.
   */
  static async addUserToProperty(propertyId: string, userId: string, role: UserRole): Promise<PropertyUser> {
    try {
      const assignment = await request<BackendPropertyUserAssignmentResult>(
        `/api/properties/${propertyId}/users`,
        {
          method: 'POST',
          body: { userId, role }, // Backend expects userId and role
        }
      );

      // To return a full PropertyUser, we need user's name, email, avatar.
      // The backend should ideally return these details for the assigned user
      // as part of the response to this POST request to avoid an extra fetch.
      // For now, we'll make an assumption or return partial data.
      // Fetching the user separately to complete the PropertyUser object:
      const userDetails = await request<BackendUserSimple>(`/api/users/${userId}`, { method: 'GET' });

      return {
        assignmentId: assignment.id,
        userId: assignment.user_id,
        propertyId: assignment.property_id,
        role: assignment.role,
        userFullName: userDetails?.full_name || 'N/A',
        userEmail: userDetails?.email || 'N/A',
        userAvatarUrl: userDetails?.avatar_url || '',
      };
    } catch (error) {
      console.error(`Error adding user ${userId} to property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a user's assignment from a property by the assignment ID.
   */
  static async removeUserFromProperty(assignmentId: string): Promise<void> {
    try {
      // Backend DELETE /api/property-users/:assignmentId expects no body and returns 204.
      await request<void>(`/api/property-users/${assignmentId}`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error removing user assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Update a user's role for a specific property assignment.
   * Backend PATCH /api/property-users/:assignmentId/role returns the updated assignment.
   */
  static async updateUserPropertyRole(assignmentId: string, newRole: UserRole): Promise<PropertyUser> {
    try {
      const updatedAssignment = await request<BackendPropertyUserAssignmentResult>(
        `/api/property-users/${assignmentId}/role`,
        {
          method: 'PATCH',
          body: { role: newRole },
        }
      );

      // Similar to addUserToProperty, fetch user details to construct full PropertyUser.
      const userDetails = await request<BackendUserSimple>(`/api/users/${updatedAssignment.user_id}`, { method: 'GET' });

      return {
        assignmentId: updatedAssignment.id,
        userId: updatedAssignment.user_id,
        propertyId: updatedAssignment.property_id,
        role: updatedAssignment.role,
        userFullName: userDetails?.full_name || 'N/A',
        userEmail: userDetails?.email || 'N/A',
        userAvatarUrl: userDetails?.avatar_url || '',
      };
    } catch (error) {
      console.error(`Error updating role for assignment ${assignmentId}:`, error);
      throw error;
    }
  }
}