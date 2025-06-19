import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, CheckCircle, XCircle, Clock, DollarSign, 
  BarChart3, PieChart, AlertCircle, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartPie, Pie, Cell
} from 'recharts';
import { loadProperties } from '../utils/properties';
import { loadBudgetRequests, loadBudgetTransfers } from '../utils/budgets';
import { loadCapexRequests } from '../utils/capex';
import { loadAssetDisposals } from '../utils/assetDisposal';

const Dashboard = () => {
  const [stats, setStats] = useState({
    properties: 0,
    pendingApprovals: 0,
    activeCapex: 0,
    budgetUtilization: 0
  });
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [capexStatusData, setCapexStatusData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load properties
      const properties = await loadProperties();
      
      // Calculate total pending approvals across all properties
      let pendingApprovals = 0;
      let activeCapexCount = 0;
      let totalBudgetUtilization = 0;
      
      // Collect data for charts and activities
      const budgetQuarterlyData: any[] = [];
      const capexStatusCounts = { approved: 0, pending: 0, rejected: 0 };
      const activities: any[] = [];
      
      // Process each property
      for (const property of properties) {
        // Load budget requests
        const budgetRequests = await loadBudgetRequests(property.id, 'pending');
        pendingApprovals += budgetRequests.length;
        
        // Load budget transfers
        const budgetTransfers = await loadBudgetTransfers(property.id, 'pending');
        pendingApprovals += budgetTransfers.length;
        
        // Load capex requests
        const capexRequests = await loadCapexRequests(property.id);
        const activeCapex = capexRequests.filter(req => req.status === 'pending' || req.status === 'approved');
        activeCapexCount += activeCapex.length;
        
        // Count capex by status
        capexRequests.forEach(req => {
          if (req.status === 'approved') capexStatusCounts.approved++;
          else if (req.status === 'pending') capexStatusCounts.pending++;
          else if (req.status === 'rejected') capexStatusCounts.rejected++;
        });
        
        // Add budget utilization
        totalBudgetUtilization += property.budgetUtilization || 0;
        
        // Add recent activities
        if (budgetRequests.length > 0) {
          activities.push({
            id: budgetRequests[0].id,
            type: 'budget',
            property: property.name,
            action: 'Budget Approval Required',
            date: new Date(budgetRequests[0].createdAt).toLocaleString(),
            status: 'pending'
          });
        }
        
        if (activeCapex.length > 0) {
          activities.push({
            id: activeCapex[0].id,
            type: 'capex',
            property: property.name,
            action: `Capex Request ${activeCapex[0].status === 'approved' ? 'Approved' : 'Pending'}`,
            date: new Date(activeCapex[0].createdAt).toLocaleString(),
            status: activeCapex[0].status
          });
        }
        
        // Load asset disposals
        const disposals = await loadAssetDisposals(property.id);
        if (disposals.length > 0) {
          activities.push({
            id: disposals[0].id,
            type: 'disposal',
            property: property.name,
            action: 'Asset Disposal Submitted',
            date: new Date(disposals[0].createdAt).toLocaleString(),
            status: disposals[0].status
          });
        }
      }
      
      // Calculate average budget utilization
      const avgBudgetUtilization = properties.length > 0 
        ? Math.round(totalBudgetUtilization / properties.length) 
        : 0;
      
      // Update stats
      setStats({
        properties: properties.length,
        pendingApprovals,
        activeCapex: activeCapexCount,
        budgetUtilization: avgBudgetUtilization
      });
      
      // Create budget data (using mock data for now as we don't have historical data)
      setBudgetData([
        { name: 'Q1', planned: 250000, actual: 230000 },
        { name: 'Q2', planned: 300000, actual: 310000 },
        { name: 'Q3', planned: 400000, actual: 380000 },
        { name: 'Q4', planned: 450000, actual: 200000 },
      ]);
      
      // Create capex status data
      setCapexStatusData([
        { name: 'Approved', value: capexStatusCounts.approved, color: '#10B981' },
        { name: 'Pending', value: capexStatusCounts.pending, color: '#F59E0B' },
        { name: 'Rejected', value: capexStatusCounts.rejected, color: '#EF4444' },
      ]);
      
      // Sort activities by date (newest first) and limit to 4
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);
      
      // Format dates for display
      sortedActivities.forEach(activity => {
        const activityDate = new Date(activity.date);
        const now = new Date();
        const diffMs = now.getTime() - activityDate.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);
        
        if (diffMins < 60) {
          activity.date = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          activity.date = `${diffHours}h ago`;
        } else {
          activity.date = `${diffDays}d ago`;
        }
      });
      
      setRecentActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
  
  return (
    <div className="px-4 sm:px-6 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary-50 text-primary-600">
                <Building2 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Properties</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.properties}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-amber-50 text-amber-600">
                <Clock size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Capex</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.activeCapex}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-green-50 text-green-600">
                <BarChart3 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budget Utilization</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.budgetUtilization}%</h3>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${stats.budgetUtilization}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
        
        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Annual Budget Tracking</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Capex Request Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={capexStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {capexStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </RechartPie>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {activity.status === 'pending' && (
                      <Clock size={18} className="text-amber-500" />
                    )}
                    {activity.status === 'approved' && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                    {activity.status === 'acknowledged' && (
                      <CheckCircle size={18} className="text-blue-500" />
                    )}
                    {activity.status === 'rejected' && (
                      <XCircle size={18} className="text-red-500" />
                    )}
                    {activity.status === 'draft' && (
                      <AlertCircle size={18} className="text-purple-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                    <p className="text-sm text-gray-500">{activity.property}</p>
                  </div>
                  <div className="ml-3">
                    <button className="p-1 rounded-full hover:bg-gray-200">
                      <ArrowRight size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 text-center">
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All Activities
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;