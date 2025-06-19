import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Mail, Phone, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Edit2, Trash2,
  User as UserIcon, Shield, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '../types/user';
import { useUserManagement } from '../contexts/UserManagementContext';
import UserFormModal from '../components/admin/UserFormModal';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { getUser, updateUser, deleteUser } = useUserManagement();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        setLoading(true);
        const userData = await getUser(userId);
        setUser(userData);
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId, getUser]);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      if (userId) {
        const success = await deleteUser(userId);
        if (success) {
          navigate('/admin');
        }
      }
    }
  };

  const handleSave = async (updatedUser: Omit<User, 'id'>) => {
    if (user) {
      const success = await updateUser(user.id, {
        fullName: updatedUser.name,
        role: updatedUser.role
      });
      
      if (success) {
        // Refresh user data
        const refreshedUser = await getUser(user.id);
        if (refreshedUser) {
          setUser(refreshedUser);
        }
        setShowEditModal(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
        <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 flex items-center gap-2"
            >
              <Edit2 size={16} />
              <span>Edit User</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              <span>Delete User</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon size={40} className="text-gray-400" />
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.role}</p>
                
                <span className={`mt-4 px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                  user.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{user.phone}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center">
                    <Shield size={16} className="text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{user.department}</span>
                  </div>
                )}
                {user.dateJoined && (
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Joined {user.dateJoined}</span>
                  </div>
                )}
                {user.lastLogin && (
                  <div className="flex items-center">
                    <Clock size={16} className="text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Last login {user.lastLogin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Properties */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Properties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.properties.map((property, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center">
                      <Building2 size={20} className="text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{property}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {user.recentActivity && user.recentActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {user.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <AlertCircle size={16} className="text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        {activity.property && (
                          <p className="text-xs text-gray-500">{activity.property}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        user={user}
      />
    </div>
  );
};

export default UserDetail;