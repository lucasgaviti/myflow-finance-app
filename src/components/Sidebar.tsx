import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  Target,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  path: string;
};

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Transações',
    icon: Receipt,
    path: '/transactions',
  },
  {
    label: 'Metas',
    icon: Target,
    path: '/goals',
  },
];

function getUserDisplayName(email?: string | null) {
  if (!email) {
    return 'Usuário';
  }

  return email.split('@')[0];
}

function getUserInitials(displayName: string) {
  const words = displayName.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { user } = useAuth();

  const userName = getUserDisplayName(user?.email);
  const userInitials = getUserInitials(userName);

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${
        mobileOpen ? 'mobile-open' : ''
      }`}
    >
      <div>
        <div className="sidebar-top">
          {!collapsed && (
            <img
              src={logo}
              alt="MyFlow Finance"
              className="sidebar-logo-image"
            />
          )}

          <button
            type="button"
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={
              collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
            }
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {menuItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="user-card">
        <div className="user-avatar">{userInitials}</div>

        {!collapsed && (
          <div>
            <div className="user-name">{userName}</div>
            <div className="user-role">Conta pessoal</div>
          </div>
        )}
      </div>
    </aside>
  );
}