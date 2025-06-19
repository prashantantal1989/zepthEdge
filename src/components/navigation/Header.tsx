import { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Bell, Search, Menu, Building2, LayoutDashboard, BarChart3, DollarSign, FileSpreadsheet, Trash2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Tooltip from '../ui/Tooltip';
import { getPageTitle } from '../../utils/navigation';
import { getPropertyById } from '../../utils/properties';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const propertyMatch = location.pathname.match(/^\/properties\/(\w+)/);
  const propertyId = propertyMatch ? propertyMatch[1] : null;

  const getPropertyInfo = () => {
    if (propertyId) {
      const property = getPropertyById(propertyId);
      return property ? {
        name: property.name,
        address: property.address
      } : null;
    }
    return null;
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (notificationCount > 0) {
      setNotificationCount(0);
    }
  };

  const propertyInfo = getPropertyInfo();

  return (
    <header className="bg-white border-b border-pastel-pink border-opacity-20 sticky top-0 z-10 shadow-sm">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-md text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 mr-4 ${!isAuthenticated ? 'hidden' : 'lg:hidden'}`}
            >
              <Menu size={20} />
            </button>
            
            <div className="ml-2 lg:ml-0">
              <h1 className="text-xl font-semibold text-pastel-dusty">{getPageTitle(location.pathname)}</h1>
              {propertyInfo && (
                <div className="flex items-center text-sm text-pastel-gray">
                  <Building2 size={14} className="mr-1.5 flex-shrink-0" />
                  <span className="truncate">
                    {propertyInfo.name} • {propertyInfo.address}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-56 rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-sm bg-white placeholder-pastel-gray text-pastel-dusty"
              />
              <Tooltip content="Search across the platform">
                <Search size={16} className="absolute left-3 top-2.5 text-pastel-gray" />
              </Tooltip>
            </div>
            
            <div className="relative">
              <Tooltip content="View notifications">
                <button
                  onClick={toggleNotifications}
                  className="p-2 rounded-full text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 relative"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-pastel-mauve rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </Tooltip>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-pastel-pink border-opacity-20 rounded-lg shadow-pastel z-20">
                  <div className="p-3 border-b border-pastel-pink border-opacity-20">
                    <h3 className="text-sm font-semibold text-pastel-dusty">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-3 border-b border-pastel-pink border-opacity-10 hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer">
                      <p className="text-sm font-medium text-pastel-dusty">Budget Approval Required</p>
                      <p className="text-xs text-pastel-gray">Courtyard Marriott budget needs your approval</p>
                      <p className="text-xs text-pastel-gray mt-1">10 minutes ago</p>
                    </div>
                    <div className="p-3 border-b border-pastel-pink border-opacity-10 hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer">
                      <p className="text-sm font-medium text-pastel-dusty">New Capex Request</p>
                      <p className="text-xs text-pastel-gray">Hilton Garden Inn submitted a new Capex request</p>
                      <p className="text-xs text-pastel-gray mt-1">2 hours ago</p>
                    </div>
                    <div className="p-3 hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer">
                      <p className="text-sm font-medium text-pastel-dusty">Document Updated</p>
                      <p className="text-xs text-pastel-gray">RFI #103 was updated by John Smith</p>
                      <p className="text-xs text-pastel-gray mt-1">Yesterday</p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-pastel-pink border-opacity-20 text-center">
                    <button className="text-xs text-pastel-mauve font-medium hover:text-pastel-dusty">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden sm:block">
              <img 
                src={user?.avatar || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2"} 
                alt="User" 
                className="w-8 h-8 rounded-full object-cover ring-2 ring-pastel-pink ring-opacity-20"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 -mb-3">
          {propertyId && (
            <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
              <NavLink
                to={`/properties/${propertyId}`}
                end
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Property overview">
                  <LayoutDashboard size={16} className="mr-1.5" />
                </Tooltip>
                Overview
              </NavLink>

              <NavLink
                to={`/properties/${propertyId}/financial`}
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Financial reports and analytics">
                  <BarChart3 size={16} className="mr-1.5" />
                </Tooltip>
                Financial
              </NavLink>

              <NavLink
                to={`/properties/${propertyId}/budget`}
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Budget management and approvals">
                  <DollarSign size={16} className="mr-1.5" />
                </Tooltip>
                Budget
              </NavLink>

              <NavLink
                to={`/properties/${propertyId}/capex`}
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Capital expenditure requests">
                  <FileSpreadsheet size={16} className="mr-1.5" />
                </Tooltip>
                Capex
              </NavLink>

              <NavLink
                to={`/properties/${propertyId}/disposal`}
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Asset disposal management">
                  <Trash2 size={16} className="mr-1.5" />
                </Tooltip>
                Asset Disposal
              </NavLink>

              <NavLink
                to={`/properties/${propertyId}/collab`}
                className={({ isActive }) => `px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center ${
                  isActive
                    ? 'bg-pastel-mauve text-white shadow-sm'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10 hover:text-pastel-dusty'
                }`}
              >
                <Tooltip content="Document collaboration tools">
                  <FileText size={16} className="mr-1.5" />
                </Tooltip>
                Documents
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;