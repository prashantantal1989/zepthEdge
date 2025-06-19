import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Loader2 } from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserForm) => void;
  user?: UserForm | null;
}

interface UserForm {
  id?: string;
  name: string;
  email: string;
  role: string;
  properties: string[];
  status: 'active' | 'pending' | 'inactive';
}

const UserFormModal = ({ isOpen, onClose, onSave, user }: UserFormModalProps) => {
  const { createUser, updateUser } = useUserManagement();
  const [formData, setFormData] = useState<UserForm>({
    name: '',
    email: '',
    role: '',
    properties: [],
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        properties: [],
        status: 'active'
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const saveUser = async () => {
      try {
        if (user) {
          // Update existing user
          const success = await updateUser(user.id, {
            fullName: formData.name,
            role: formData.role,
            // In a real implementation, we would handle property assignments here
          });
          
          if (success) {
            onSave(formData);
          } else {
            setError('Failed to update user');
          }
        } else {
          // Create new user
          // In a real implementation, we would generate a random password
          // and send an invitation email
          const newUser = await createUser(
            formData.email,
            'temporaryPassword123',
            {
              fullName: formData.name,
              role: formData.role,
              // In a real implementation, we would handle property assignments here
            }
          );
          
          if (newUser) {
            onSave(formData);
          } else {
            setError('Failed to create user');
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    };
    
    saveUser();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user ? 'Edit' : 'New'} User
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter user's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select role</option>
                    <option value="Admin">Admin</option>
                    <option value="Property Manager">Property Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Properties
                  </label>
                  <input
                    type="text"
                    value={formData.properties.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      properties: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                    })}
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter property names (comma-separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      status: e.target.value as 'active' | 'pending' | 'inactive'
                    })}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {user ? 'Saving...' : 'Creating...'}
                      </span>
                    ) : (
                      user ? 'Save Changes' : 'Create User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserFormModal;