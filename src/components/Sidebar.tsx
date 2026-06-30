import {
  LayoutDashboard,
  Receipt,
  Target,
  CalendarCheck,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

import logo from '../assets/logo.png';

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Planejamento Mensal',
    icon: CalendarCheck,
    path: '/monthly-plan',
  },
  {
    label: 'Transações',
    icon: Receipt,
    path: '/transactions',
  },
  {
    label: 'Importações',
    icon: Upload,
    path: '/imports',
  },
  {
    label: 'Metas',
    icon: Target,
    path: '/goals',
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: Props) {
  return (
    <aside
      className={`sidebar ${
        collapsed ? 'collapsed' : ''
      } ${mobileOpen ? 'mobile-open' : ''}`}
    >
      <div>
        <div className="sidebar-top">
          {!collapsed && (
            <img
              src={logo}
              alt="MyFlow"
              className="sidebar-logo-image"
            />
          )}

          <button
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={
              collapsed
                ? 'Expandir menu'
                : 'Recolher menu'
            }
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                <Icon size={20} />

                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="user-card">
        <div className="user-avatar">
          LG
        </div>

        {!collapsed && (
          <div>
            <div className="user-name">
              Lucas
            </div>

            <div className="user-role">
              Personal Finance
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
