import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { UserService } from '../services/userService';

interface UserManagementContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  getUser: (id: string) => Promise<User | null>;
  createUser: (
    email: string,
    password: string,
    userData: {
      fullName: string;
      role: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    }
  ) => Promise<User | null>;
  updateUser: (
    id: string,
    userData: {
      fullName?: string;
      role?: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    }
  ) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  inviteUser: (
    email: string,
    options?: {
      role?: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    }
  ) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};

interface UserManagementProviderProps {
  children: ReactNode;
}

export const UserManagementProvider = ({ children }: UserManagementProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const getUser = async (id: string): Promise<User | null> => {
    try {
      return await UserService.getUserById(id);
    } catch (err) {
      console.error('Error getting user:', err);
      setError('Failed to get user');
      return null;
    }
  };

  const createUser = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      role: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    }
  ): Promise<User | null> => {
    try {
      const user = await UserService.createUser(email, password, userData);
      if (user) {
        await refreshUsers();
      }
      return user;
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
      return null;
    }
  };

  const updateUser = async (
    id: string,
    userData: {
      fullName?: string;
      role?: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    }
  ): Promise<boolean> => {
    try {
      const success = await UserService.updateUser(id, userData);
      if (success) {
        await refreshUsers();
      }
      return success;
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const success = await UserService.deleteUser(id);
      if (success) {
        await refreshUsers();
      }
      return success;
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
      return false;
    }
  };

  const inviteUser = async (
    email: string,
    options: {
      role?: string;
      properties?: { id: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
    } = {}
  ): Promise<boolean> => {
    try {
      const success = await UserService.inviteUser(email, options);
      if (success) {
        await refreshUsers();
      }
      return success;
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      return await UserService.resetPassword(email);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password');
      return false;
    }
  };

  const value = {
    users,
    loading,
    error,
    refreshUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    resetPassword
  };

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  );
};