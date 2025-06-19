import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Filter, MapPin, Hotel, 
  Users, DollarSign, ArrowUpRight, 
  PlusCircle, MoreHorizontal, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadProperties } from '../utils/properties';
import Tooltip from '../components/ui/Tooltip';

interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  rooms: number;
  status: 'active' | 'pending' | 'inactive';
  budgetUtilization: number;
  image: string;
}

const PropertiesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await loadProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);
  
  const filteredProperties = properties.filter(property => {
    // Apply search filter
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchQuery.toLowerCase());    
    return matchesSearch;
  });
  
  const handlePropertyClick = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };
  
  const handleAddNew = () => {
    navigate('/onboarding');
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
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        
        <div className="flex space-x-3">
          <Tooltip content="Add a new hotel property">
            <button 
              onClick={handleAddNew}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
            >
              <PlusCircle size={16} />
              <span>Add Hotel</span>
            </button>
          </Tooltip>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 size={48} className="animate-spin text-pastel-mauve" />
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProperties.map((property) => (
            <motion.div
              key={property.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
              onClick={() => handlePropertyClick(property.id)}
            >
              <div className="relative h-48">
                <img 
                  src={property.image} 
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white text-xl font-semibold">{property.name}</h3>
                  <div className="flex items-center text-white/90 text-sm mt-1">
                    <MapPin size={14} className="mr-1" />
                    {property.location}
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Hotel size={16} className="text-gray-500" />
                    <span className="ml-2 text-sm text-gray-600">{property.type || 'Hotel'}</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="text-gray-500" />
                    <span className="ml-2 text-sm text-gray-600">{property.rooms} Rooms</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-gray-500" />
                      <span className="ml-2 text-sm text-gray-600">Budget Utilization</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{property.budgetUtilization || 0}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (property.budgetUtilization || 0) > 80 ? 'bg-red-500' : 
                        (property.budgetUtilization || 0) > 60 ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${property.budgetUtilization || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-primary-600 font-medium flex items-center">
                  View Details
                  <ArrowUpRight size={14} className="ml-1" />
                </span>
                
                <button className="p-1.5 rounded-full hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={16} className="text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PropertiesList;