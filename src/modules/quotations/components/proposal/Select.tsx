/**
 * EGEN System - Custom Dropdown Component
 * Substitui completamente o <select> nativo: trigger + painel de opções customizados.
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

interface OptionData {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Adds a search input at the top of the dropdown to filter options. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

/** Flattens an <option>'s children (which may be split across several JSX nodes, e.g. `{a} ({b})`) into one string. */
function flattenLabel(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenLabel).join('');
  return '';
}

function extractOptions(children: React.ReactNode): OptionData[] {
  const opts: OptionData[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const props = child.props as { value?: string; children?: React.ReactNode };
      if (props.value !== undefined) {
        const label = flattenLabel(props.children).trim() || String(props.value);
        opts.push({ value: props.value, label });
      }
    }
  });
  return opts;
}

export function Select({ value, onChange, children, className = '', disabled, searchable = false, searchPlaceholder = 'Pesquisar...' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const options = React.useMemo(() => extractOptions(children), [children]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const query = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, searchable, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Reset filter and focus the search box whenever the panel opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setHighlightIndex(options.findIndex((o) => o.value === value));
      if (searchable) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!isOpen || highlightIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightIndex]);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      // While searchable and typing in the filter box, only the navigation
      // keys below are intercepted — everything else must reach the input.
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightIndex].value);
          }
          break;
        case ' ':
          if (!searchable) {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
              handleSelect(filteredOptions[highlightIndex].value);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filteredOptions, highlightIndex, handleSelect, searchable],
  );

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2 text-sm text-left
          text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-600
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-egen-navy/30 dark:focus:ring-egen-yellow/30
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          ${isOpen ? 'ring-2 ring-egen-navy/30 dark:ring-egen-yellow/30 border-egen-navy dark:border-egen-yellow' : ''}
          ${className}
        `}
      >
        <span className={`truncate ${selectedLabel ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {selectedLabel || 'Selecione...'}
        </span>
        <ChevronDown
          className={`
            w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            {searchable && (
              <div className="relative border-b border-gray-100 dark:border-gray-700">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            )}
            <ul ref={listRef} role="listbox" className="max-h-48 overflow-y-auto overscroll-contain">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic">Nenhum resultado</li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        px-3 py-2 text-sm cursor-pointer transition-colors duration-75 truncate
                        ${isSelected
                          ? 'bg-egen-navy/10 dark:bg-egen-yellow/10 text-egen-navy dark:text-egen-yellow font-medium'
                          : isHighlighted
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {opt.label}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Select;
