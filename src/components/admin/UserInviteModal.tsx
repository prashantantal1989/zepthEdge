import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Plus, Trash2 } from 'lucide-react';
import { loadProperties } from '../../utils/properties';

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: {
    emails: string[];
    role: string;
    properties: { id: string; name: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[];
  }) => void;
}

const UserInviteModal = ({ isOpen, onClose, onInvite }: UserInviteModalProps) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [role, setRole] = useState('viewer');
  const [properties, setProperties] = useState<{ id: string; name: string; role: 'admin' | 'manager' | 'finance' | 'viewer' }[]>([]);
  const [availableProperties, setAvailableProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const props = await loadProperties();
        setAvailableProperties(props.map(p => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen]);

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleAddProperty = (propertyId: string, propertyName: string) => {
    setProperties([...properties, { id: propertyId, name: propertyName, role: 'viewer' }]);
  };

  const handleRemoveProperty = (propertyId: string) => {
    setProperties(properties.filter(p => p.id !== propertyId));
  };

  const handlePropertyRoleChange = (propertyId: string, role: 'admin' | 'manager' | 'finance' | 'viewer') => {
    setProperties(properties.map(p => 
      p.id === propertyId ? { ...p, role } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter(email => email.trim() !== '');
    if (validEmails.length === 0) return;

    onInvite({
      emails: validEmails,
      role,
      properties
    });

    // Reset form
    setEmails(['']);
    setRole('viewer');
    setProperties([]);
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
                  Invite Users
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Addresses
                  </label>
                  <div className="space-y-3">
                    {emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            placeholder="user@example.com"
                          />
                          <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                        {emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(index)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    <Plus size={14} className="mr-1" />
                    Add another email
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Property Manager</option>
                    <option value="finance">Finance Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Properties
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedProperty = availableProperties.find(p => p.id === e.target.value);
                      if (selectedProperty && !properties.some(p => p.id === selectedProperty.id)) {
                        handleAddProperty(selectedProperty.id, selectedProperty.name);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    value=""
                  >
                    <option value="" disabled>Select property to add</option>
                    {availableProperties
                      .filter(p => !properties.some(assigned => assigned.id === p.id))
                      .map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))
                    }
                  </select>

                  {properties.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {properties.map(property => (
                        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700">{property.name}</div>
                          <div className="flex items-center gap-2">
                            <select
                              value={property.role}
                              onChange={(e) => handlePropertyRoleChange(
                                property.id, 
                                e.target.value as 'admin' | 'manager' | 'finance' | 'viewer'
                              )}
                              className="text-sm rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="finance">Finance</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveProperty(property.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  >
                    Send Invitations
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

export default UserInviteModal;