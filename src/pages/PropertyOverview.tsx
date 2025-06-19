import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  DollarSign, FileSpreadsheet, Trash2, FileText,
  MapPin, Phone, Mail, User, BarChart3,
  Calendar, Clock, Users, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { getPropertyById } from '../utils/properties';
import { loadBudgetRequests } from '../utils/budgets';
import { loadCapexRequests } from '../utils/capex';
import { loadTasks } from '../utils/tasks';

const PropertyOverview = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  
  const fetchPropertyData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load property
      const propertyData = await getPropertyById(id);
      
      if (propertyData) {
        setProperty({
          ...propertyData,
          occupancyRate: 78, // These would come from a real API
          revPAR: 185
        });
        
        // Load budget requests
        const budgetRequests = await loadBudgetRequests(id);
        
        // Load capex requests
        const capexRequests = await loadCapexRequests(id);
        
        // Load tasks
        const tasks = await loadTasks(id);
        const pendingTasksData = tasks
          .filter(task => task.status !== 'done')
          .slice(0, 4)
          .map(task => ({
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            status: task.priority === 'high' ? 'urgent' : 
                   task.priority === 'medium' ? 'normal' : 'upcoming'
          }));
        
        setPendingTasks(pendingTasksData);
        
        // Create mock data for charts (in a real app, this would come from an API)
        setRevenueData([
          { name: 'Jan', revenue: 280000 },
          { name: 'Feb', revenue: 250000 },
          { name: 'Mar', revenue: 310000 },
          { name: 'Apr', revenue: 350000 },
          { name: 'May', revenue: 420000 },
          { name: 'Jun', revenue: 480000 },
          { name: 'Jul', revenue: 520000 },
          { name: 'Aug', revenue: 540000 },
          { name: 'Sep', revenue: 480000 },
          { name: 'Oct', revenue: 400000 },
          { name: 'Nov', revenue: 380000 },
          { name: 'Dec', revenue: 450000 },
        ]);
        
        setOccupancyData([
          { name: 'Jan', occupancy: 68 },
          { name: 'Feb', occupancy: 72 },
          { name: 'Mar', occupancy: 75 },
          { name: 'Apr', occupancy: 79 },
          { name: 'May', occupancy: 82 },
          { name: 'Jun', occupancy: 85 },
          { name: 'Jul', occupancy: 88 },
          { name: 'Aug', occupancy: 90 },
          { name: 'Sep', occupancy: 84 },
          { name: 'Oct', occupancy: 78 },
          { name: 'Nov', occupancy: 73 },
          { name: 'Dec', occupancy: 76 },
        ]);
        
        setBudgetCategories([
          { name: 'Rooms', planned: 2500000, actual: 2450000 },
          { name: 'F&B', planned: 1800000, actual: 1720000 },
          { name: 'Admin', planned: 900000, actual: 950000 },
          { name: 'Marketing', planned: 700000, actual: 680000 },
          { name: 'Maintenance', planned: 1200000, actual: 1150000 },
          { name: 'Utilities', planned: 800000, actual: 830000 },
        ]);
      }
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Property Not Found</h2>
        <p className="text-gray-600 mt-2">The property you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Property Header */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="relative h-48 sm:h-64">
            <img 
              src={property.image} 
              alt={property.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-white text-2xl sm:text-3xl font-bold">{property.name}</h1>
              <div className="flex items-center text-white/90 mt-2">
                <MapPin size={16} className="mr-1.5" />
                {property.location}
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-start">
                  <MapPin size={16} className="text-gray-500 mt-0.5" />
                  <span className="ml-2 text-sm text-gray-700">{property.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-500" />
                  <span className="ml-2 text-sm text-gray-700">{property.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-500" />
                  <span className="ml-2 text-sm text-gray-700">{property.email}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">General Manager</h3>
              <div className="mt-2 flex items-center">
                <User size={16} className="text-gray-500" />
                <span className="ml-2 text-sm text-gray-700">{property.generalManager}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Property Details</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <Users size={16} className="text-gray-500" />
                  <span className="ml-2 text-sm text-gray-700">{property.rooms} Rooms</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 size={16} className="text-gray-500" />
                  <span className="ml-2 text-sm text-gray-700">{property.occupancyRate}% Occupancy</span>
                </div>
                <div className="flex items-center">
                  <DollarSign size={16} className="text-gray-500" />
                  <span className="ml-2 text-sm text-gray-700">${property.revPAR} RevPAR</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quick Links</h3>
              <div className="mt-2 space-y-2">
                <button className="flex items-center text-primary-600 hover:text-primary-700">
                  <DollarSign size={16} className="mr-1.5" />
                  <span className="text-sm font-medium">Budget</span>
                  <ArrowUpRight size={14} className="ml-1" />
                </button>
                <button className="flex items-center text-primary-600 hover:text-primary-700">
                  <FileSpreadsheet size={16} className="mr-1.5" />
                  <span className="text-sm font-medium">Capex Requests</span>
                  <ArrowUpRight size={14} className="ml-1" />
                </button>
                <button className="flex items-center text-primary-600 hover:text-primary-700">
                  <FileText size={16} className="mr-1.5" />
                  <span className="text-sm font-medium">Documents</span>
                  <ArrowUpRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Performance Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue (YTD)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '0.375rem' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Rate (%)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={occupancyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{ borderRadius: '0.375rem' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Occupancy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Budget Categories */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetCategories}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '0.375rem' }}
                />
                <Bar dataKey="planned" fill="#94A3B8" name="Planned" />
                <Bar dataKey="actual" fill="#3B82F6" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Pending Tasks */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Pending Tasks</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mt-0.5">
                      {task.status === 'urgent' ? (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      ) : task.status === 'normal' ? (
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-gray-500" />
                        <span className="ml-1.5 text-xs text-gray-500">Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100">
                    Action
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 text-center">
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All Tasks
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PropertyOverview;