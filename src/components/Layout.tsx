import React, { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Briefcase,
  FileText,
  UserCircle,
  Building2,
  Wrench,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { hasPermission, hasAnyPermission, getRoleLabel } from '../utils/permissions';
import { ThemeToggle } from './ThemeToggle';
import { CollapsedFlyoutMenu } from './CollapsedFlyoutMenu';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  /** Se informado, o item aparece quando o usuário tem QUALQUER uma destas permissões. */
  permissions?: string[];
  subItems?: NavigationItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTÊNCIA DO ESTADO COLAPSADO
// ═══════════════════════════════════════════════════════════════════════════════

const COLLAPSE_KEY = 'egen_sidebar_collapsed';

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP (para a sidebar colapsada)
// ═══════════════════════════════════════════════════════════════════════════════

const SidebarTooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group/tip">
    {children}
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-egen-navy dark:bg-egen-dark-surface text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[60] border border-white/10">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-egen-navy dark:border-r-egen-dark-surface" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/crm') || path.startsWith('/propostas')) return ['Comercial'];
    return [];
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const userRole = userProfile?.role || 'requester';
  const userPermissions = userProfile?.permissions || [];

  // ─── Persistência do colapso ────────────────────────────────────────────────
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  // ─── Navegação ──────────────────────────────────────────────────────────────
  const navigation: NavigationItem[] = useMemo(
    () => [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: 'canViewDashboard',
      },
      {
        name: 'Comercial',
        href: '/crm',
        icon: Briefcase,
        permission: 'canViewClients',
        subItems: [
          { name: 'Clientes', href: '/crm/clients', icon: Building2, permission: 'canViewClients' },
          { name: 'Leads', href: '/crm/leads', icon: UserCircle, permission: 'canViewLeads' },
          { name: 'Propostas', href: '/propostas', icon: FileText, permissions: ['canManageQuotations', 'canViewAllProposals'] },
        ],
      },
      {
        name: 'Usuários',
        href: '/users',
        icon: Users,
        permission: 'canManageUsers',
      },
      {
        name: 'Equipamentos',
        href: '/equipamentos',
        icon: Wrench,
        permission: 'canViewEquipment',
      },
      {
        name: 'Manutencoes',
        href: '/manutencoes',
        icon: Settings,
        permission: 'canViewMaintenance',
      },
    ],
    []
  );

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    );
  };

  const canAccessItem = (item: NavigationItem) => {
    if (item.permissions) return hasAnyPermission(userPermissions, item.permissions);
    if (!item.permission) return true;
    return hasPermission(userPermissions, item.permission);
  };

  const isItemActive = (href: string, subItems?: NavigationItem[]) => {
    if (location.pathname === href) return true;
    if (subItems) return subItems.some((sub) => location.pathname === sub.href);
    return false;
  };

  const isSubItemActive = (href: string) => location.pathname === href;

  const accessibleNavigation = useMemo(
    () => navigation.filter(canAccessItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, userPermissions]
  );

  // ─── Render de item de navegação ────────────────────────────────────────────
  const renderNavigationItem = (item: NavigationItem, isMobile = false, collapsed = false) => {
    if (!canAccessItem(item)) return null;

    const accessibleSubItems = item.subItems ? item.subItems.filter(canAccessItem) : [];
    const hasAccessibleSubItems = accessibleSubItems.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = isItemActive(item.href, item.subItems);

    // ── Colapsado ──
    if (collapsed) {
      if (hasAccessibleSubItems) {
        return (
          <CollapsedFlyoutMenu
            key={item.name}
            item={item}
            isActive={isActive}
            subItems={accessibleSubItems}
            isSubItemActive={isSubItemActive}
          />
        );
      }

      return (
        <SidebarTooltip key={item.name} label={item.name}>
          <Link
            to={item.href}
            aria-label={item.name}
            className={`flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-egen-yellow text-egen-navy shadow-md shadow-egen-yellow/25'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
          </Link>
        </SidebarTooltip>
      );
    }

    // ── Expandido ──
    return (
      <div key={item.name}>
        <div className="flex items-center">
          <Link
            to={item.href}
            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center flex-1 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-egen-yellow text-egen-navy shadow-md shadow-egen-yellow/25 font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
          {hasAccessibleSubItems && (
            <button
              onClick={() => toggleExpanded(item.name)}
              aria-label={isExpanded ? `Recolher ${item.name}` : `Expandir ${item.name}`}
              className={`ml-1 p-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-egen-yellow hover:bg-white/10'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
          )}
        </div>

        {hasAccessibleSubItems && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-3 overflow-hidden"
                initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ originY: 0 }}
              >
                {accessibleSubItems.map((subItem, index) => (
                  <motion.div
                    key={subItem.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.14, delay: index * 0.03, ease: 'easeOut' }}
                  >
                    <Link
                      to={subItem.href}
                      onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isSubItemActive(subItem.href)
                          ? 'bg-egen-yellow/15 text-egen-yellow'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                      }`}
                    >
                      <subItem.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{subItem.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  // ─── User card (footer expandido / mobile) ──────────────────────────────────
  const renderUserAvatar = (size = 'w-10 h-10') =>
    userProfile?.avatar_url ? (
      <img
        src={userProfile.avatar_url}
        alt={userProfile.name}
        className={`${size} rounded-xl object-cover flex-shrink-0`}
      />
    ) : (
      <div className={`${size} bg-egen-yellow rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-egen-yellow/25`}>
        <Shield className="w-5 h-5 text-egen-navy" />
      </div>
    );

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-egen-bg via-egen-bg to-slate-100 dark:from-egen-dark-bg dark:via-egen-dark-bg dark:to-[#0b1c39] transition-colors duration-300">
      {/* ─── Drawer mobile ─── */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Painel */}
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] z-10 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="on-dark-surface flex flex-col h-full bg-egen-navy dark:bg-egen-dark-surface shadow-2xl">
            {/* Header mobile */}
            <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
              <Link to="/" className="flex items-center flex-1 justify-center" onClick={() => setSidebarOpen(false)}>
                <img src="/LOGO-HOR-DM.png" alt="EGEN Geradores" className="h-11 w-auto" />
              </Link>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fechar menu"
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Subtítulo */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs text-white/50 text-center uppercase tracking-wider font-medium">Sistema de Gestão</p>
            </div>

            {/* Navegação mobile */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
              {accessibleNavigation.map((item) => renderNavigationItem(item, true, false))}
            </nav>

            {/* Footer mobile */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                {renderUserAvatar()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userProfile?.name || user?.email}</p>
                  <p className="text-xs text-white/50">{userProfile?.roleName || getRoleLabel(userRole as any)}</p>
                  {userProfile?.department && (
                    <p className="text-xs text-egen-yellow font-medium truncate">{userProfile.department}</p>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  aria-label="Sair"
                  className="p-2 rounded-xl text-white/50 hover:text-egen-red hover:bg-egen-red/10 transition-all flex-shrink-0"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Sidebar desktop (flutuante) ─── */}
      <div
        className={`hidden lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:flex lg:flex-col h-[calc(100vh-2rem)] transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="on-dark-surface flex flex-col h-full w-full rounded-3xl border border-white/10 bg-egen-navy/90 dark:bg-egen-dark-surface/90 backdrop-blur-2xl shadow-2xl shadow-egen-navy/30 overflow-hidden">
          {/* Header desktop */}
          <div className={`flex items-center h-16 border-b border-white/10 transition-all duration-200 ${isCollapsed ? 'px-2 justify-center' : 'px-4'}`}>
            <Link to="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'flex-1 justify-center'}`}>
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.img
                    key="icon"
                    src="/LOGO-DM.png"
                    alt="EGEN"
                    className="h-10 w-10 object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  />
                ) : (
                  <motion.img
                    key="full"
                    src="/LOGO-HOR-DM.png"
                    alt="EGEN Geradores"
                    className="h-10 w-auto"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
              </AnimatePresence>
            </Link>
            {!isCollapsed && <ThemeToggle />}
          </div>

          {/* Navegação desktop */}
          <nav className={`flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar ${isCollapsed ? 'px-1.5 space-y-1' : 'px-3 space-y-1.5'}`}>
            {accessibleNavigation.map((item) => renderNavigationItem(item, false, isCollapsed))}
          </nav>

          {/* Footer desktop */}
          <div className="border-t border-white/10">
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="collapsed-footer"
                  className="flex flex-col items-center gap-2 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <SidebarTooltip label={userProfile?.name || user?.email || 'Usuário'}>
                    {renderUserAvatar()}
                  </SidebarTooltip>
                  <SidebarTooltip label="Tema">
                    <ThemeToggle className="w-11 h-11 flex items-center justify-center" />
                  </SidebarTooltip>
                  <SidebarTooltip label="Sair">
                    <button
                      onClick={handleSignOut}
                      aria-label="Sair"
                      className="w-11 h-11 flex items-center justify-center rounded-xl text-white/60 hover:text-egen-red hover:bg-egen-red/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </SidebarTooltip>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded-footer"
                  className="p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
                    {renderUserAvatar()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate" title={userProfile?.name || user?.email}>
                        {userProfile?.name || user?.email}
                      </p>
                      <p className="text-xs text-white/50 truncate">{userProfile?.roleName || getRoleLabel(userRole as any)}</p>
                      {userProfile?.department && (
                        <p className="text-xs text-egen-yellow font-medium truncate">{userProfile.department}</p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      aria-label="Sair"
                      className="p-2 rounded-xl text-white/50 hover:text-egen-red hover:bg-egen-red/10 transition-all flex-shrink-0"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de colapso */}
            <div className="px-3 pb-3 pt-0.5 flex justify-center">
              <button
                onClick={toggleCollapsed}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs"
                title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Recolher
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Conteúdo principal ─── */}
      <div className={`min-h-screen transition-[padding] duration-300 ${isCollapsed ? 'lg:pl-28' : 'lg:pl-72'}`}>
        {/* Header mobile */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-3 bg-egen-navy dark:bg-egen-dark-surface px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="flex items-center justify-center w-11 h-11 -ml-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center flex-1 justify-center">
            <Link to="/" className="flex items-center">
              <img src="/LOGO-HOR-DM.png" alt="EGEN Geradores" className="h-9 w-auto hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          <ThemeToggle />
        </div>

        {/* Conteúdo da página */}
        <main
          className={`min-h-screen ${
            location.pathname === '/' || location.pathname.startsWith('/propostas/') ? '' : 'py-4 px-4 sm:px-6 lg:px-6 xl:px-8'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
