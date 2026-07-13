import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { hasPermission } from './utils/permissions';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import { CrmPage } from './modules/crm';
import { SalesQuotationPage, ProposalManagementPage } from './modules/quotations/components/proposal';
import { EquipmentPage } from './modules/equipment';
import { MaintenancePage } from './modules/maintenance';
import ResetPassword from './components/ResetPassword';
import Home from './components/Home';
import ProposalConfigPage from './components/ProposalConfigPage';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  permission?: string;
  userPermissions: string[];
}> = ({ children, permission, userPermissions }) => {
  if (permission && !hasPermission(userPermissions, permission)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Acesso Negado</h3>
        <p className="text-red-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  return <>{children}</>;
};

// Componente interno que gerencia as rotas autenticadas
const AuthenticatedApp: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const userPermissions = userProfile?.permissions || [];

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permission="canViewDashboard" userPermissions={userPermissions}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crm/*"
          element={
            <ProtectedRoute permission="canViewClients" userPermissions={userPermissions}>
              <CrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/propostas"
          element={
            <ProtectedRoute permission="canManageQuotations" userPermissions={userPermissions}>
              <ProposalManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/propostas/nova"
          element={
            <ProtectedRoute permission="canManageQuotations" userPermissions={userPermissions}>
              <SalesQuotationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/propostas/:id"
          element={
            <ProtectedRoute permission="canManageQuotations" userPermissions={userPermissions}>
              <SalesQuotationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipamentos"
          element={
            <ProtectedRoute permission="canViewEquipment" userPermissions={userPermissions}>
              <EquipmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manutencoes"
          element={
            <ProtectedRoute permission="canViewMaintenance" userPermissions={userPermissions}>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute permission="canManageUsers" userPermissions={userPermissions}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute permission="canManageQuotations" userPermissions={userPermissions}>
              <ProposalConfigPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública para redefinição de senha - deve ficar FORA da verificação de autenticação */}
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Todas as outras rotas passam pelo componente de autenticação */}
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </Router>
  );
}

export default App;
