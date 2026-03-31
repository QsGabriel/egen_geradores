// src/components/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  FileText,
  Briefcase,
  Settings,
  ArrowRight,
  Zap,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ModuleItem {
  path: string;
  label: string;
  description: string;
  permission: string;
  icon: React.ComponentType<any>;
}

interface ModuleGroup {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  items: ModuleItem[];
}

// ============================================
// MODULE CONFIGURATION
// ============================================

const moduleGroups: ModuleGroup[] = [
  {
    title: 'Comercial',
    description: 'Gestão de vendas e relacionamento',
    icon: Briefcase,
    color: 'from-[#F3B229] to-[#E5A320]',
    items: [
      { 
        path: '/crm', 
        label: 'CRM', 
        description: 'Gestão de clientes e leads',
        permission: 'canViewClients', 
        icon: Building2 
      },
      { 
        path: '/crm/leads', 
        label: 'Leads', 
        description: 'Pipeline de oportunidades',
        permission: 'canViewLeads', 
        icon: UserCircle 
      },
      { 
        path: '/propostas', 
        label: 'Propostas', 
        description: 'Criar e gerenciar propostas',
        permission: 'canManageQuotations', 
        icon: FileText 
      },
    ],
  },
  {
    title: 'Gestão',
    description: 'Visão geral e controle',
    icon: LayoutDashboard,
    color: 'from-[#0D2A59] to-[#1a3a70]',
    items: [
      { 
        path: '/dashboard', 
        label: 'Dashboard', 
        description: 'Métricas e indicadores',
        permission: 'canViewDashboard', 
        icon: LayoutDashboard 
      },
    ],
  },
  {
    title: 'Administração',
    description: 'Configurações do sistema',
    icon: Settings,
    color: 'from-[#6A93C7] to-[#5a83b7]',
    items: [
      { 
        path: '/users', 
        label: 'Usuários', 
        description: 'Gerenciar acessos',
        permission: 'canManageUsers', 
        icon: Users 
      },
    ],
  },
];

// ============================================
// COMPONENT
// ============================================

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role || 'requester';
  
  // Filter modules based on user permissions
  const accessibleGroups = moduleGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        hasPermission(role as any, item.permission as any)
      )
    }))
    .filter(group => group.items.length > 0);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="min-h-screen w-full bg-egen-bg dark:bg-egen-dark-bg transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D2A59] via-[#1a3a70] to-[#0D2A59] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-5xl mx-auto">
            {/* Logo & Welcome */}
            <div className="flex flex-col items-center text-center animate-fade-in-down">
              <div className="mb-6 p-4 bg-white/10 dark:bg-white/5 rounded-2xl backdrop-blur-sm">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-[#F3B229]" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'Usuário'}!
              </h1>
              
              <p className="text-lg sm:text-xl text-white/70 max-w-2xl">
                Sistema de Integração EGEN Geradores
              </p>
              
              {userProfile?.department && (
                <div className="mt-4 px-4 py-2 bg-[#F3B229]/20 text-[#F3B229] rounded-full text-sm font-medium">
                  {userProfile.department}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 md:h-20 overflow-hidden">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0 100V60C240 20 480 0 720 20C960 40 1200 80 1440 60V100H0Z" 
              className="fill-egen-bg dark:fill-egen-dark-bg"
            />
          </svg>
        </div>
      </div>

      {/* Modules Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-semibold text-egen-navy dark:text-white mb-2">
              Acesso Rápido
            </h2>
            <p className="text-egen-gray-mid dark:text-white/60">
              Selecione o módulo que deseja acessar
            </p>
          </div>

          {/* Module Groups */}
          <div className="space-y-8 sm:space-y-10">
            {accessibleGroups.map((group, groupIndex) => (
              <div 
                key={group.title} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${groupIndex * 0.1}s` }}
              >
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${group.color} shadow-lg`}>
                    <group.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-egen-navy dark:text-white">
                      {group.title}
                    </h3>
                    <p className="text-sm text-egen-gray-mid dark:text-white/50">
                      {group.description}
                    </p>
                  </div>
                </div>

                {/* Module Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {group.items.map((item, itemIndex) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="group relative p-5 sm:p-6 bg-white dark:bg-egen-dark-surface rounded-2xl shadow-card hover:shadow-card-hover border border-gray-100 dark:border-white/5 hover:border-[#F3B229]/30 dark:hover:border-[#F3B229]/30 transition-all duration-300 hover:-translate-y-1"
                      style={{ animationDelay: `${(groupIndex * 0.1) + (itemIndex * 0.05)}s` }}
                    >
                      {/* Card Content */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-egen-navy/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#F3B229]/10 dark:group-hover:bg-[#F3B229]/10 transition-all duration-300 group-hover:scale-110">
                          <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-egen-navy dark:text-[#6A93C7] group-hover:text-[#F3B229] transition-colors" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-semibold text-egen-gray-dark dark:text-white group-hover:text-egen-navy dark:group-hover:text-[#F3B229] transition-colors">
                            {item.label}
                          </h4>
                          <p className="text-sm text-egen-gray-mid dark:text-white/50 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Arrow Indicator */}
                      <div className="absolute top-5 right-5 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-[#F3B229]" />
                      </div>

                      {/* Hover Accent */}
                      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#F3B229] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {accessibleGroups.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Settings className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Sem módulos disponíveis
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Entre em contato com o administrador para solicitar acesso.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 px-4 text-center">
        <p className="text-sm text-egen-gray-mid dark:text-white/40">
          EGEN Geradores © {new Date().getFullYear()} • Sistema de Gestão
        </p>
      </footer>
    </div>
  );
};

export default Home;