import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Users,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { hasPermission, getRoleLabel } from '../utils/permissions';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: string;
  subItems?: NavigationItem[];
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = userProfile?.role || 'requester';

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      permission: 'canViewDashboard'
    },
    { 
      name: 'Comercial / CRM', 
      href: '/crm', 
      icon: Briefcase,
      permission: 'canViewClients'
    },
    { 
      name: 'Usuários', 
      href: '/users', 
      icon: Users,
      permission: 'canManageUsers'
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (href: string, subItems?: NavigationItem[]) => {
    if (location.pathname === href) return true;
    if (subItems) {
      return subItems.some(subItem => location.pathname === subItem.href);
    }
    return false;
  };

  const isSubItemActive = (href: string) => {
    return location.pathname === href;
  };

  const canAccessItem = (item: NavigationItem) => {
    if (!item.permission) return true;
    return hasPermission(userRole, item.permission as any);
  };

  const renderNavigationItem = (item: NavigationItem, isMobile = false) => {
    if (!canAccessItem(item)) return null;

const hasSubItems = item.subItems && item.subItems.length > 0;
const accessibleSubItems = hasSubItems ? item.subItems!.filter(canAccessItem) : [];
const hasAccessibleSubItems = accessibleSubItems.length > 0;
const isExpanded = expandedItems.includes(item.name);
const isActive = isItemActive(item.href, item.subItems);

    return (
      <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${navigation.indexOf(item) * 0.05}s` }}>
        <div className="flex items-center">
          <Link
            to={item.href}
            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-egen-yellow/10 text-egen-yellow border-l-2 border-egen-yellow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 transition-transform duration-200 ${isActive ? 'text-egen-yellow' : ''}`} />
            {item.name}
          </Link>
          {hasAccessibleSubItems && (
            <button
              onClick={() => toggleExpanded(item.name)}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isActive ? 'text-egen-yellow hover:bg-egen-yellow/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        
        {hasAccessibleSubItems && (
          <div className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            {accessibleSubItems.map((subItem, index) => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isExpanded ? 'animate-fade-in-up' : ''} ${
                  isSubItemActive(subItem.href)
                    ? 'bg-egen-yellow/10 text-egen-yellow border-l-2 border-egen-yellow'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80 hover:translate-x-1'
                }`}
              >
                <subItem.icon className="mr-3 h-4 w-4" />
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-egen-bg dark:bg-egen-dark-bg transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setSidebarOpen(false)} 
        />
        {/* Mobile sidebar - usando mesma estrutura do desktop */}
        <div className={`transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent 
            userRole={userRole}
            userProfile={userProfile}
            user={user}
            navigation={navigation}
            renderNavigationItem={(item) => renderNavigationItem(item, true)}
            handleSignOut={handleSignOut}
            onClose={() => setSidebarOpen(false)}
            isMobile={true}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col h-screen">
        <SidebarContent 
          userRole={userRole}
          userProfile={userProfile}
          user={user}
          navigation={navigation}
          renderNavigationItem={renderNavigationItem}
          handleSignOut={handleSignOut}
          isMobile={false}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 bg-egen-navy px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/10 transition-all duration-200 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
        
        <div className="flex items-center flex-1 justify-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/LOGO-HOR-DM.png" 
              alt="EGEN Geradores"
              className="h-10 w-auto mr-2 hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
          
          {/* Theme toggle for mobile */}
          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className={`min-h-screen animate-fade-in ${location.pathname === '/' ? '' : 'py-4 px-4 sm:px-6 lg:px-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Componente reutilizável para o conteúdo da sidebar
interface SidebarContentProps {
  userRole: string;
  userProfile: any;
  user: any;
  navigation: NavigationItem[];
  renderNavigationItem: (item: NavigationItem) => React.ReactNode;
  handleSignOut: () => void;
  onClose?: () => void;
  isMobile: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  userRole,
  userProfile,
  user,
  navigation,
  renderNavigationItem,
  handleSignOut,
  onClose,
  isMobile
}) => {
  return (
    <div className={`flex flex-col ${isMobile ? 'h-screen fixed inset-y-0 left-0 w-64 shadow-2xl' : 'h-full'} bg-egen-navy dark:bg-egen-dark-bg transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
        <Link to="/" className="flex items-center group flex-1 justify-center">        
          <img 
            src="/LOGO-HOR-DM.png" 
            alt="EGEN Geradores" 
            className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Subtitle */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white text-center">EGEN Geradores</h2>
        <p className="text-xs text-white/50 text-center">Sistema de Gestão</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => renderNavigationItem(item))}
      </nav>
      
      {/* User info and logout */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center mb-4 p-2 rounded-lg bg-white/5">
          <div className="w-10 h-10 bg-egen-yellow rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <Shield className="w-5 h-5 text-egen-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate" title={userProfile?.name || user?.email}>
              {userProfile?.name || user?.email}
            </p>
            <p className="text-xs text-white/50">{getRoleLabel(userRole as any)}</p>
            <p className="text-xs text-egen-yellow font-medium">{userProfile?.department}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-egen-red/80 rounded-lg hover:bg-egen-red transition-all duration-200 active:scale-98"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Layout;