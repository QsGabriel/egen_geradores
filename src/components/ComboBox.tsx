import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
}

export default function ComboBox({
  value,
  onChange,
  options,
  placeholder = 'Selecione ou digite...',
  className = '',
  allowCustom = true,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isUserFiltering = search && search !== value;
  const filtered = isUserFiltering
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === search.toLowerCase()
  );

  const showCustomOption = allowCustom && isUserFiltering && !exactMatch;

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt);
      setSearch('');
      setIsOpen(false);
      setHighlightIndex(0);
    },
    [onChange],
  );

  const handleCustom = useCallback(() => {
    if (search.trim()) {
      onChange(search.trim());
      setSearch('');
      setIsOpen(false);
      setHighlightIndex(0);
    }
  }, [search, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setSearch('');
    setHighlightIndex(0);
  }, [onChange]);

  useEffect(() => {
    setSearch('');
    setHighlightIndex(0);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            const v = e.target.value;
            setSearch(v);
            setHighlightIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(value || '');
          }}
          onClick={() => {
            setIsOpen(true);
            setSearch(value || '');
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightIndex((prev) =>
                Math.min(prev + 1, filtered.length + (showCustomOption ? 1 : 0) - 1),
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (showCustomOption && highlightIndex === filtered.length) {
                handleCustom();
              } else if (filtered[highlightIndex]) {
                handleSelect(filtered[highlightIndex]);
              } else if (showCustomOption) {
                handleCustom();
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setSearch(value || '');
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30 dark:focus:ring-egen-yellow/30 placeholder:text-gray-400 dark:placeholder:text-gray-500 pr-8"
        />
        {value && !isOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (filtered.length > 0 || showCustomOption) && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        >
          {filtered.map((opt, idx) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                idx === highlightIndex
                  ? 'bg-egen-navy/10 dark:bg-egen-yellow/20 text-egen-navy dark:text-egen-yellow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt}
            </li>
          ))}
          {showCustomOption && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                handleCustom();
              }}
              onMouseEnter={() => setHighlightIndex(filtered.length)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-700 italic ${
                highlightIndex === filtered.length
                  ? 'bg-egen-navy/10 dark:bg-egen-yellow/20 text-egen-navy dark:text-egen-yellow'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Usar "{search}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
