import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, Filter, Plus, Search, ChevronRight, ArrowRight
} from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import { motion } from 'framer-motion';
import * as Collapsible from '@radix-ui/react-collapsible';
import { loadBudgets, loadBudgetRequests, Budget, BudgetRequest } from '../utils/budgets';

interface CategoryGroup {
  category: string;
  items: BudgetRequest[];
  totalAmount: number;
}

const BudgetApprovals = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [budgetsData, requestsData] = await Promise.all([
        loadBudgets(id, new Date().getFullYear()),
        loadBudgetRequests(id)
      ]);

      setBudgets(budgetsData);
      setBudgetRequests(requestsData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const groupedBudgetItems = budgetRequests.reduce((groups: CategoryGroup[], request) => {
    const budget = budgets.find(b => b.id === request.budgetId);
    if (!budget) return groups;

    const existingGroup = groups.find(g => g.category === budget.category);
    if (existingGroup) {
      existingGroup.items.push(request);
      existingGroup.totalAmount += request.amount;
    } else {
      groups.push({
        category: budget.category,
        items: [request],
        totalAmount: request.amount
      });
    }
    return groups;
  }, []);
  
  const filteredGroups = groupedBudgetItems
    .map(group => ({
      ...group,
      items: group.items.filter(request => {
        const matchesSearch = 
          request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus ? request.status === filterStatus : true;
        
        return matchesSearch && matchesStatus;
      })
    }))
    .filter(group => group.items.length > 0);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
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

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search budgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
        </div>
        
        <div className="flex space-x-3">
          <Tooltip content="Filter by status">
            <div className="relative">
              <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
                <Filter size={16} />
                <span>{filterStatus ? `Status: ${filterStatus}` : 'All Statuses'}</span>
              </button>
            </div>
          </Tooltip>
          
          <Tooltip content="Transfer funds between budget categories">
            <button 
              onClick={() => navigate(`/properties/${id}/budget/transfer`)}
              className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve"
            >
              <ArrowRight size={16} />
              <span>Transfer Budget</span>
            </button>
          </Tooltip>
          
          <Tooltip content="Create a new budget request">
            <button 
              onClick={() => navigate(`/properties/${id}/budget/new`)}
              className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
            >
              <Plus size={16} />
              <span>New Budget</span>
            </button>
          </Tooltip>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredGroups.map((group) => (
            <motion.div
              key={group.category}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 overflow-hidden"
            >
              <Collapsible.Root
                open={expandedCategories.includes(group.category)}
                onOpenChange={() => toggleCategory(group.category)}
              >
                <Collapsible.Trigger className="w-full">
                  <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r from-pastel-peach to-pastel-pink bg-opacity-10 hover:bg-opacity-20 cursor-pointer transition-all duration-200 ${
                    expandedCategories.includes(group.category) ? 'border-b border-pastel-pink border-opacity-20' : ''
                  }`}>
                    <div>
                      <h3 className="text-lg font-medium text-pastel-dusty">{group.category}</h3>
                      <p className="text-sm text-pastel-gray mt-1">
                        {group.items.length} items • Total: ${group.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-pastel-dusty transition-transform ${
                        expandedCategories.includes(group.category) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </Collapsible.Trigger>
                
                <Collapsible.Content>
                  <div className="bg-white">
                    <table className="min-w-full divide-y divide-pastel-pink divide-opacity-20">
                      <thead className="bg-pastel-peach bg-opacity-5">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Submitted By
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-pastel-gray uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-pastel-pink divide-opacity-20">
                        {group.items.map((item) => (
                          <tr 
                            key={item.id}
                            className="hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer transition-colors"
                            onClick={() => navigate(`/properties/${id}/budget/${item.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm text-pastel-dusty">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-pastel-dusty">${item.amount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-pastel-gray">{item.submittedBy}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-pastel-gray">{item.submittedDate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                className="text-pastel-mauve hover:text-pastel-dusty"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/properties/${id}/budget/${item.id}`);
                                }}
                              >
                                <ArrowUpRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default BudgetApprovals;