import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import Breadcrumbs, { BreadcrumbItem } from '../components/ui/Breadcrumbs';
import { getBreadcrumbs } from '../utils/navigation';
import Dashboard from '../pages/Dashboard';
import PropertiesList from '../pages/PropertiesList';
import PropertyOverview from '../pages/PropertyOverview';
import BudgetApprovals from '../pages/BudgetApprovals';
import BudgetDetail from '../pages/BudgetDetail';
import BudgetNew from '../pages/BudgetNew';
import BudgetTransfer from '../pages/BudgetTransfer';
import CapexNew from '../pages/CapexNew';
import CapexRequests from '../pages/CapexRequests';
import CapexDetail from '../pages/CapexDetail';
import Financial from '../pages/Financial';
import TransmittalNew from '../pages/TransmittalNew';
import Help from '../pages/Help';
import RFINew from '../pages/RFINew';
import SubmittalNew from '../pages/SubmittalNew';
import AssetDisposal from '../pages/AssetDisposal';
import DocumentWorkspace from '../pages/DocumentWorkspace';
import Transmittal from '../pages/Transmittal';
import AssetInventory from '../pages/AssetInventory';
import AssetDetail from '../pages/AssetDetail';
import AssetNew from '../pages/AssetNew';
import AssetMaintenanceNew from '../pages/AssetMaintenanceNew';
import Submittals from '../pages/Submittals';
import TaskManagement from '../pages/TaskManagement';
import RFI from '../pages/RFI';
import AssetDisposalNew from '../pages/AssetDisposalNew';
import AssetDisposalDetail from '../pages/AssetDisposalDetail';
import DocumentCollaboration from '../pages/DocumentCollaboration';
import ArticleDetail from '../pages/ArticleDetail';
import SubmitTicket from '../pages/SubmitTicket';
import HotelOnboarding from '../pages/HotelOnboarding';
import AdminPanel from '../pages/AdminPanel';
import UserDetail from '../pages/UserDetail';
import Login from '../pages/Login';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/ui/PageLoader';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const propertyMatch = location.pathname.match(/^\/properties\/(\w+)/);
  const propertyId = propertyMatch ? propertyMatch[1] : null;
  const breadcrumbs = getBreadcrumbs(location.pathname);
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && location.pathname !== '/login') {
        navigate('/login');
      } else if (isAuthenticated && location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);
  
  if (loading) {
    return <PageLoader />;
  }

  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="flex h-screen bg-pastel-peach bg-opacity-5">
      {isAuthenticated && location.pathname !== '/login' && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAuthenticated && location.pathname !== '/login' && (
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        
        <main className="flex-1 overflow-y-auto pb-10">
          {isAuthenticated && location.pathname !== '/login' && (
            <div className="px-4 sm:px-6 py-3 bg-white border-b border-pastel-pink border-opacity-20">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Routes>
                <Route path="/login" element={
                  isAuthenticated ? <Navigate to="/dashboard\" replace /> : <Login />
                } />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/properties" element={<PropertiesList />} />
                <Route path="/properties/:id" element={<PropertyOverview />} />
                <Route path="/properties/:id/budget" element={<BudgetApprovals />} />
                <Route path="/properties/:id/budget/new" element={<BudgetNew />} />
                <Route path="/properties/:id/budget/:budgetId" element={<BudgetDetail />} />
                <Route path="/properties/:id/budget/transfer" element={<BudgetTransfer />} />
                <Route path="/properties/:id/capex" element={<CapexRequests />} />
                <Route path="/properties/:id/capex/new" element={<CapexNew />} />
                <Route path="/properties/:id/capex/:capexId" element={<CapexDetail />} />
                <Route path="/properties/:id/financial" element={<Financial />} />
                <Route path="/properties/:id/disposal" element={<AssetDisposal />} />
                <Route path="/properties/:id/disposal/new" element={<AssetDisposalNew />} />
                <Route path="/properties/:id/disposal/:disposalId" element={<AssetDisposalDetail />} />
                <Route path="/properties/:id/assets" element={<AssetInventory />} />
                <Route path="/properties/:id/assets/new" element={<AssetNew />} />
                <Route path="/properties/:id/assets/:assetId" element={<AssetDetail />} />
                <Route path="/properties/:id/assets/:assetId/maintenance/new" element={<AssetMaintenanceNew />} />
                <Route path="/properties/:id/collab" element={<DocumentCollaboration />} />
                <Route path="/properties/:id/collab/workspace" element={<DocumentWorkspace />} />
                <Route path="/properties/:id/collab/transmittal" element={<Transmittal />} />
                <Route path="/properties/:id/collab/transmittal/new" element={<TransmittalNew />} />
                <Route path="/properties/:id/collab/submittals" element={<Submittals />} />
                <Route path="/properties/:id/collab/submittals/new" element={<SubmittalNew />} />
                <Route path="/properties/:id/collab/rfi" element={<RFI />} />
                <Route path="/properties/:id/collab/rfi/new" element={<RFINew />} />
                <Route path="/properties/:id/collab/tasks" element={<TaskManagement />} />
                <Route path="/onboarding" element={<HotelOnboarding />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/users/:userId" element={<UserDetail />} />
                <Route path="/help" element={<Help />} />
                <Route path="/help/articles/:articleId" element={<ArticleDetail />} />
                <Route path="/help/submit-ticket" element={<SubmitTicket />} />
                <Route path="*" element={<Navigate to="/dashboard\" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;