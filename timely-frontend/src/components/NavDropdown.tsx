/**
 * Reusable navigation dropdown component
 * Supports keyboard navigation and proper accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavItem } from '../config/navigation';

interface NavDropdownProps {
  item: NavItem;
  badges?: Record<string, number>;
  onNavigate?: () => void;
}

const NavDropdown: React.FC<NavDropdownProps> = ({ item, badges = {}, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Check if any child route is active
  const isActive = item.children?.some(child => child.to && location.pathname.startsWith(child.to));

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleChildClick = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && item.children && (
        <div
          className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {item.children.map((child, index) => {
              if (!child.to) return null;
              
              const badge = child.badgeKey ? badges[child.badgeKey] : 0;
              const isChildActive = location.pathname === child.to;

              return (
                <Link
                  key={child.to || index}
                  to={child.to}
                  onClick={handleChildClick}
                  className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    isChildActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  role="menuitem"
                >
                  <span>{child.label}</span>
                  {badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavDropdown;

