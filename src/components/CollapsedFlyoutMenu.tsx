import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
// Espelha a interface NavigationItem definida em Layout.tsx.
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  subItems?: NavigationItem[];
}

interface CollapsedFlyoutMenuProps {
  item: NavigationItem;
  isActive: boolean;
  subItems: NavigationItem[];
  isSubItemActive: (href: string) => boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Submenu flutuante (via portal) exibido ao passar o mouse sobre um item com
// subitens quando a sidebar está colapsada.
export const CollapsedFlyoutMenu: React.FC<CollapsedFlyoutMenuProps> = ({
  item,
  isActive,
  subItems,
  isSubItemActive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, [cancelClose]);

  // ── Trigger events ─────────────────────────────────────────────────────────
  const handleTriggerEnter = useCallback(() => {
    cancelClose();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.right + 12, // gap entre sidebar flutuante e flyout
      });
    }
    setIsOpen(true);
  }, [cancelClose]);

  // ── Recalcula posição em scroll/resize ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const recalc = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.top, left: rect.right + 12 });
      }
    };

    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen]);

  // ── Cleanup no unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // ── Portal ─────────────────────────────────────────────────────────────────
  const portal = ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && coords && (
        <motion.div
          className="fixed z-[9999] bg-white/95 dark:bg-egen-dark-surface/95 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl rounded-2xl p-2 min-w-[210px] flex flex-col gap-1"
          style={{ top: coords.top, left: coords.left }}
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Cabeçalho da seção */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-egen-navy/50 dark:text-white/40 uppercase tracking-wider border-b border-black/5 dark:border-white/10 mb-1">
            {item.name}
          </div>

          {/* Subitens */}
          {subItems.map((subItem) => {
            const active = isSubItemActive(subItem.href);
            return (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-egen-navy/10 text-egen-navy dark:bg-egen-yellow/15 dark:text-egen-yellow'
                    : 'text-egen-gray-dark dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-egen-navy dark:hover:text-white'
                }`}
              >
                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{subItem.name}</span>
              </Link>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  // ── Botão de disparo ─────────────────────────────────────────────────────────
  return (
    <>
      <button
        ref={triggerRef}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={scheduleClose}
        aria-label={item.name}
        className={`flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-egen-yellow text-egen-navy shadow-md shadow-egen-yellow/25'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
      </button>
      {portal}
    </>
  );
};

export default CollapsedFlyoutMenu;
