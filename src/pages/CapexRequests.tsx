import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Building2, DollarSign, Clock,
  CheckCircle2, XCircle, ArrowUpRight, FileSpreadsheet,
  BarChart3, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { loadCapexRequests, CapexRequest } from '../utils/capex';
import { loadBudgets } from '../utils/budgets';
import { getPropertyById } from '../utils/properties';

const CapexRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [capexRequests, setCapexRequests] = useState<CapexRequest[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalBudget: 0,
    proposalsReceived: 0,
    proposalsApproved: 0,
    balanceBudget: 0
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Load property
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
        
        // Load budgets
        const budgetsData = await loadBudgets(id, new Date().getFullYear());
        setBudgets(budgetsData);
        
        // Load capex requests
        const capexData = await loadCapexRequests(id);
        setCapexRequests(capexData);
        
        // Calculate stats
        const totalBudget = budgetsData.reduce((sum, budget) => sum + Number(budget.totalBudget), 0);
        const proposalsReceived = capexData.reduce((sum, capex) => sum + Number(capex.amount), 0);
        const proposalsApproved = capexData
          .filter(capex => capex.status === 'approved')
          .reduce((sum, capex) => sum + Number(capex.amount), 0);
        const balanceBudget = totalBudget - proposalsApproved;
        
        setStats({
          totalBudget,
          proposalsReceived,
          proposalsApproved,
          balanceBudget
        });
        
        // Group capex requests by budget category
        const categoryGroups: {[key: string]: any} = {};
        
        for (const capex of capexData) {
          const budget = budgetsData.find(b => b.id === capex.budgetId);
          if (budget) {
            const category = budget.category;
            if (!categoryGroups[category]) {
              categoryGroups[category] = {
                name: category,
                code: budget.code,
                budget: Number(budget.totalBudget),
                requests: []
              };
            }
            
            categoryGroups[category].requests.push(capex);
          }
        }
        
        // Create category data for charts
        const catData = Object.values(categoryGroups).map((cat: any, index) => ({
          name: cat.name,
          value: cat.budget,
          color: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#6366F1'
        }));
        
        setCategoryData(catData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Prepare data for status chart
  const statusData = [
    { 
      name: 'Approved', 
      value: capexRequests.filter(req => req.status === 'approved').length,
      color: '#10B981' 
    },
    { 
      name: 'Pending', 
      value: capexRequests.filter(req => req.status === 'pending').length,
      color: '#F59E0B' 
    },
    { 
      name: 'Rejected', 
      value: capexRequests.filter(req => req.status === 'rejected').length,
      color: '#EF4444' 
    }
  ];

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-4 sm:px-6 py-6 text-center">
        <h2 className="text-xl font-semibold text-pastel-dusty">Property Not Found</h2>
        <p className="text-pastel-gray mt-2">The property you're looking for doesn't exist.</p>
      </div>
    );
  }

  // Prepare stats for display
  const displayStats = [
    {
      title: 'Total Budget',
      value: `${property.currency.symbol} ${stats.totalBudget.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Proposals Received',
      value: `${property.currency.symbol} ${stats.proposalsReceived.toLocaleString()}`,
      change: `${capexRequests.length} total`,
      trend: 'up',
      icon: FileSpreadsheet,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Proposals Approved',
      value: `${property.currency.symbol} ${stats.proposalsApproved.toLocaleString()}`,
      change: `${capexRequests.filter(req => req.status === 'approved').length} approved`,
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Balance Budget',
      value: `${property.currency.symbol} ${stats.balanceBudget.toLocaleString()}`,
      change: `${stats.totalBudget > 0 ? Math.round((stats.balanceBudget / stats.totalBudget) * 100) : 0}%`,
      trend: 'down',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-100'
    }
  ];

  return (
    <div className="px-4 sm:px-6 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-pastel-dusty">Capex Requests</h1>
            <p className="text-sm text-pastel-gray mt-1">Manage and track capital expenditure requests</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-sm"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-pastel-gray" />
            </div>
            
            <button
              onClick={() => navigate(`/properties/${id}/capex/new`)}
              className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
            >
              <Plus size={16} />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pastel-gray">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-pastel-dusty">{stat.value}</h3>
                  <p className={`text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <h3 className="text-lg font-semibold text-pastel-dusty mb-4">Budget Allocation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <h3 className="text-lg font-semibold text-pastel-dusty mb-4">Request Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#B5838D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Category Sections */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-pastel-peach bg-opacity-5 border-b border-pastel-pink border-opacity-20">
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Budget Ref</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-pastel-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {capexRequests.map((request) => (
                  <tr 
                    key={request.id}
                    className="hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer"
                    onClick={() => navigate(`/properties/${id}/capex/${request.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-pastel-dusty">{request.projectName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-pastel-gray bg-pastel-peach bg-opacity-10 px-2 py-1 rounded-full">
                        {request.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-gray">{request.budgetReference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-dusty">{property.currency.symbol} {Number(request.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-gray">{request.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-gray">{request.projectLead}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-pastel-gray">{request.startDate} - {request.endDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/properties/${id}/capex/${request.id}`);
                        }}
                        className="text-pastel-mauve hover:text-pastel-dusty"
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CapexRequests;