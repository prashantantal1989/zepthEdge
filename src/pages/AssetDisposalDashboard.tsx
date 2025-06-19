import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, DollarSign, Clock, CheckCircle2, XCircle,
  BarChart3, PieChart, ArrowUpRight, Search, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartPie, Pie, Cell
} from 'recharts';
import { loadAssetDisposals, AssetDisposal } from '../utils/assetDisposal';
import { getPropertyById } from '../utils/properties';

interface DisposalStats {
  totalAssets: number;
  pendingApprovals: number;
  totalValue: number;
  recoveryRate: number;
}

interface AssetDisposalDashboardProps {
  propertyId: string | undefined;
}

const AssetDisposalDashboard = ({ propertyId }: AssetDisposalDashboardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProperty, setFilterProperty] = useState<string | null>(null);
  const [disposals, setDisposals] = useState<AssetDisposal[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [disposalsByCategory, setDisposalsByCategory] = useState<any[]>([]);
  const [monthlyDisposals, setMonthlyDisposals] = useState<any[]>([]);
  const [recentDisposals, setRecentDisposals] = useState<any[]>([]);
  
  const [stats, setStats] = useState<DisposalStats>({
    totalAssets: 156,
    pendingApprovals: 12,
    totalValue: 450000,
    recoveryRate: 68
  });

  const fetchData = useCallback(async () => {
    if (!propertyId) return;
    
    setLoading(true);
    try {
      // Load property
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);
      
      // Load disposals
      const disposalsData = await loadAssetDisposals(propertyId);
      setDisposals(disposalsData);
      
      // Calculate stats
      const pendingApprovals = disposalsData.filter(d => d.status === 'pending').length;
      const totalValue = disposalsData.reduce((sum, d) => sum + Number(d.netBookValue), 0);
      // Recovery rate is calculated as disposableValue / netBookValue
      const totalNetBookValue = disposalsData.reduce((sum, d) => sum + Number(d.netBookValue), 0);
      const totalDisposableValue = disposalsData.reduce((sum, d) => sum + Number(d.disposableValue), 0);
      const recoveryRate = totalNetBookValue > 0 
        ? Math.round((totalDisposableValue / totalNetBookValue) * 100) 
        : 0;
      
      setStats({
        totalAssets: disposalsData.length,
        pendingApprovals,
        totalValue,
        recoveryRate
      });
      
      // Group disposals by category
      const categories: {[key: string]: number} = {};
      disposalsData.forEach(disposal => {
        if (!categories[disposal.assetType]) {
          categories[disposal.assetType] = 0;
        }
        categories[disposal.assetType] += Number(disposal.netBookValue);
      });
      
      // Convert to chart data format
      const categoryColors = ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'];
      const categoryData = Object.entries(categories).map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length]
      }));
      
      setDisposalsByCategory(categoryData);
      
      // Group disposals by month
      const months: {[key: string]: {completed: number, pending: number}} = {};
      const currentYear = new Date().getFullYear();
      
      // Initialize with last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        months[monthKey] = { completed: 0, pending: 0 };
      }
      
      // Count disposals by month
      disposalsData.forEach(disposal => {
        const disposalDate = new Date(disposal.createdAt);
        if (disposalDate.getFullYear() === currentYear) {
          const monthKey = disposalDate.toLocaleString('default', { month: 'short' });
          if (months[monthKey]) {
            if (disposal.status === 'approved') {
              months[monthKey].completed++;
            } else if (disposal.status === 'pending') {
              months[monthKey].pending++;
            }
          }
        }
      });
      
      // Convert to chart data format
      const monthlyData = Object.entries(months).map(([month, data]) => ({
        month,
        completed: data.completed,
        pending: data.pending
      }));
      
      setMonthlyDisposals(monthlyData);
      
      // Get recent disposals
      const recent = disposalsData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(d => ({
          id: d.id,
          property: propertyData?.name || 'Unknown Property',
          asset: d.assetDescription,
          value: Number(d.netBookValue),
          status: d.status
        }));
      
      setRecentDisposals(recent);
    } catch (error) {
      console.error('Error loading disposal data:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        {/* Header Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Building2 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Total Assets</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">{stats.totalAssets}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                <Clock size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">{stats.pendingApprovals}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <DollarSign size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Total Value</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">
                  ${stats.totalValue.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <BarChart3 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pastel-gray">Recovery Rate</p>
                <h3 className="text-2xl font-bold text-pastel-dusty">{stats.recoveryRate}%</h3>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${stats.recoveryRate}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <h3 className="text-lg font-medium text-pastel-dusty mb-4">Monthly Disposals</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyDisposals}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <h3 className="text-lg font-medium text-pastel-dusty mb-4">Disposals by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={disposalsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                  >
                    {disposalsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartPie>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Recent Disposals */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
          <div className="px-6 py-4 border-b border-pastel-pink border-opacity-20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-pastel-dusty">Recent Disposals</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search disposals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-48 rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-sm"
                  />
                  <Search size={16} className="absolute left-2.5 top-2 text-pastel-gray" />
                </div>
                <button className="p-1.5 rounded-lg border border-pastel-pink border-opacity-20 hover:border-pastel-mauve text-pastel-gray">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-pastel-pink divide-opacity-20">
            {recentDisposals.map((disposal) => (
              <div 
                key={disposal.id}
                className="px-6 py-4 hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer"
                onClick={() => navigate(`/properties/${propertyId}/disposal/${disposal.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-medium text-pastel-dusty">{disposal.asset}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        disposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        disposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {disposal.status.charAt(0).toUpperCase() + disposal.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-pastel-gray">
                      <Building2 size={12} className="mr-1" />
                      {disposal.property}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-pastel-dusty">
                        ${disposal.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-pastel-gray">Asset Value</p>
                    </div>
                    <button className="p-1.5 text-pastel-mauve hover:text-pastel-dusty">
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recentDisposals.length > 0 && (
            <div className="px-6 py-3 border-t border-pastel-pink border-opacity-20 text-center">
              <button 
                onClick={() => navigate(`/properties/${propertyId}/disposal`)}
                className="text-sm text-pastel-mauve font-medium hover:text-pastel-dusty"
              >
                View All Disposals
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AssetDisposalDashboard;