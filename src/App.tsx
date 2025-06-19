import { BrowserRouter as Router } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AuthProvider from './contexts/AuthContext';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { WorkflowProvider } from './contexts/WorkflowContext';

function App() {
  return (
    <AuthProvider>
      <UserManagementProvider>
        <WorkflowProvider>
          <Router>
            <AppLayout />
          </Router>
        </WorkflowProvider>
      </UserManagementProvider>
    </AuthProvider>
  );
}

export default App;