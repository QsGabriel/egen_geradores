import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { hasPermission } from './utils/permissions';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import { CrmPage } from './modules/crm';
import ResetPassword from './components/ResetPassword';
import Home from './components/Home';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  permission?: string;
  userRole: string;
}> = ({ children, permission, userRole }) => {
  if (permission && !hasPermission(userRole as any, permission as any)) {
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

  const userRole = userProfile?.role || 'requester';

  return (
    <Layout>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permission="canViewDashboard" userRole={userRole}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crm"
          element={
            <ProtectedRoute permission="canViewClients" userRole={userRole}>
              <CrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute permission="canManageUsers" userRole={userRole}>
              <UserManagement />
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
