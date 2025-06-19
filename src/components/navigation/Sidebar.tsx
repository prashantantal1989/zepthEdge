import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, LayoutDashboard, Users, LogOut, LifeBuoy, X } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarVariants = {
    open: { 
      width: '238px',
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: { 
      width: '68px',
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-pastel-gray bg-opacity-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        animate={open ? "open" : "closed"}
        className="bg-[#B5838D] fixed lg:relative z-30 h-full"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-white/20">
            <div className="flex items-center justify-between w-full">
              <Logo size="normal" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-2 text-xl font-semibold text-white"
                  >
                    Zepth Edge
                  </motion.span>
                )}
              </AnimatePresence>
              {open && window.innerWidth < 1024 && (
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:bg-white hover:bg-opacity-10"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-3 space-y-1.5">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white/70 hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <Tooltip content="Dashboard" side="right">
                <LayoutDashboard size={20} />
              </Tooltip>
              {open && <span className="ml-3 font-medium">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/properties"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white/70 hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <Tooltip content="Properties" side="right">
                <Building2 size={20} />
              </Tooltip>
              {open && <span className="ml-3 font-medium">Properties</span>}
            </NavLink>

            <NavLink
              to="/admin"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white/70 hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <Tooltip content="Admin Panel" side="right">
                <Users size={20} />
              </Tooltip>
              {open && <span className="ml-3 font-medium">Admin Panel</span>}
            </NavLink>

            <NavLink
              to="/help"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white/70 hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <Tooltip content="Help Center" side="right">
                <LifeBuoy size={20} />
              </Tooltip>
              {open && <span className="ml-3 font-medium">Help Center</span>}
            </NavLink>
          </div>

          {/* User section */}
          <div className="p-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={user?.avatar || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2"} 
                  alt="User" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                />
                {open && (
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-white/70">{user?.role || 'Role'}</p>
                  </div>
                )}
              </div>
              <Tooltip content="Logout" side="right">
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-white/70 hover:bg-white hover:bg-opacity-10"
                >
                  <LogOut size={18} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;