// src/components/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import {
  LayoutDashboard,
  Package,
  PlusSquare,
  History,
  FileText,
  AlertCircle,
  RefreshCw,
  Users,
  Building2,
  DollarSign,
  Calendar,
} from 'lucide-react';

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role || 'requester';
  
  const pages = [
    { path: '/dashboard', label: 'Dashboard', permission: 'canViewDashboard', icon: LayoutDashboard },
    { path: '/equipment', label: 'Equipamentos', permission: 'canViewEquipment', icon: Package },
    { path: '/add-equipment', label: 'Adicionar Equipamento', permission: 'canAddEquipment', icon: PlusSquare },
    { path: '/movements', label: 'Movimentações', permission: 'canViewMovements', icon: History },
    { path: '/requests', label: 'Solicitações', permission: 'canViewRequests', icon: FileText },
    { path: '/expiration', label: 'Validade', permission: 'canViewExpiration', icon: AlertCircle },
    { path: '/changelog', label: 'Alterações', permission: 'canViewChangelog', icon: RefreshCw },
    { path: '/users', label: 'Usuários', permission: 'canManageUsers', icon: Users },
    { path: '/suppliers', label: 'Fornecedores', permission: 'canManageSuppliers', icon: Building2 },
    { path: '/quotations', label: 'Cotações', permission: 'canManageQuotations', icon: DollarSign },
    { path: '/request-periods', label: 'Períodos de Solicitação', permission: 'canConfigureRequestPeriods', icon: Calendar },
  ];

  // Filtra apenas as páginas acessíveis para o usuário
  const accessiblePages = pages.filter((p) =>
    hasPermission(role as any, p.permission as any)
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-egen-bg dark:bg-egen-dark-bg px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-24 transition-colors duration-300">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-down">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-egen-navy dark:text-egen-dark-text">
            Bem-vindo(a), {userProfile?.name}!
          </h1>
          <p className="text-egen-gray-mid dark:text-white/60 mt-2 sm:mt-3 text-base sm:text-lg">
            Escolha abaixo a área que deseja acessar
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          {accessiblePages.map((p, index) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.path}
                to={p.path}
                className="group p-6 sm:p-8 bg-white dark:bg-egen-dark-surface rounded-card shadow-card hover:shadow-card-hover border border-gray-100 dark:border-white/5 hover:border-egen-yellow/50 dark:hover:border-egen-yellow/30 transition-all duration-300 flex flex-col items-center justify-center text-center hover-lift animate-fade-in-up w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-xs"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-card bg-egen-navy/5 dark:bg-white/5 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-egen-yellow/10 dark:group-hover:bg-egen-yellow/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-egen-navy dark:text-egen-blue group-hover:text-egen-yellow transition-colors" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-egen-gray-dark dark:text-white group-hover:text-egen-navy dark:group-hover:text-egen-yellow transition-colors">
                  {p.label}
                </h3>
                <div className="mt-2 w-0 h-0.5 bg-egen-yellow group-hover:w-12 transition-all duration-300 rounded-full"></div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;