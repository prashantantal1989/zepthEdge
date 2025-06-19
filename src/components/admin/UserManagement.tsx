import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Filter, MoreHorizontal,
  CheckCircle, XCircle, AlertCircle, Edit2, Trash2,
  Mail, ArrowUpRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserManagement } from '../../contexts/UserManagementContext';
import UserFormModal from './UserFormModal';
import UserInviteModal from './UserInviteModal';

const UserManagement = () => {
  const navigate = useNavigate();
  const { users, loading, error, refreshUsers, deleteUser } = useUserManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole ? user.role === filterRole : true;
    
    return matchesSearch && matchesRole;
  });

  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Active Users',
      value: users.filter(u => u.status === 'active').length.toString(),
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Pending Invites',
      value: users.filter(u => u.status === 'pending').length.toString(),
      icon: Mail,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      title: 'Inactive Users',
      value: users.filter(u => u.status === 'inactive').length.toString(),
      icon: XCircle,
      color: 'text-red-600 bg-red-100'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
        <h3 className="text-lg font-medium">Error Loading Users</h3>
        <p className="mt-2">{error}</p>
        <button 
          onClick={() => refreshUsers()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <UserPlus size={20} className="text-primary-600" />
            <span className="ml-3 text-gray-700">Invite User</span>
          </button>
          <button className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Users size={20} className="text-primary-600" />
            <span className="ml-3 text-gray-700">Bulk Import</span>
          </button>
          <button className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Mail size={20} className="text-primary-600" />
            <span className="ml-3 text-gray-700">Resend Invites</span>
          </button>
          <button className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <XCircle size={20} className="text-primary-600" />
            <span className="ml-3 text-gray-700">Deactivate Users</span>
          </button>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="relative w-full sm:w-auto sm:max-w-sm">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="flex space-x-3">
            <div className="relative">
              <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50">
                <Filter size={16} />
                <span>{filterRole || 'All Roles'}</span>
              </button>
            </div>
            
            <button
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
            >
              <UserPlus size={16} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={36} className="animate-spin text-primary-600" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      variants={itemVariants}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.properties.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'active' && <CheckCircle size={12} className="mr-1" />}
                          {user.status === 'pending' && <AlertCircle size={12} className="mr-1" />}
                          {user.status === 'inactive' && <XCircle size={12} className="mr-1" />}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                            title="View Details"
                          >
                            <ArrowUpRight size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={(userData) => {
          // Handle user save
          console.log('Save user:', userData);
          setShowUserModal(false);
        }}
        user={editingUser}
      />

      <UserInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={(data) => {
          // Handle user invite
          console.log('Invite user:', data);
          setShowInviteModal(false);
        }}
      />
    </motion.div>
  );
};

export default UserManagement;