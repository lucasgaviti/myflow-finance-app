import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Receipt,
  Target,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

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

type UserMetadata = {
  full_name?: string;
  name?: string;
  display_name?: string;
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

function normalizeDisplayName(value?: string | null) {
  return value?.trim().replace(/\s+/g, ' ') || '';
}

function getUserDisplayName(
  email?: string | null,
  metadata?: UserMetadata | null,
) {
  const metadataName = normalizeDisplayName(
    metadata?.full_name ?? metadata?.display_name ?? metadata?.name,
  );

  if (metadataName) {
    return metadataName;
  }

  if (!email) {
    return 'Usuário';
  }

  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getUserInitials(displayName: string) {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'US';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const userName = useMemo(
    () =>
      getUserDisplayName(
        user?.email,
        (user?.user_metadata as UserMetadata | undefined) ?? null,
      ),
    [user],
  );

  const userInitials = useMemo(() => getUserInitials(userName), [userName]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      setIsUserMenuOpen(false);
    }
  }, [mobileOpen]);

  async function handleSignOut() {
    setIsUserMenuOpen(false);
    onCloseMobile();
    await signOut();
    navigate('/login', { replace: true });
  }

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

      <div className="sidebar-user-wrapper" ref={userMenuRef}>
        {isUserMenuOpen && (
          <div className="sidebar-user-menu" role="menu">
            <div className="sidebar-user-menu-header">
              <div className="user-avatar">{userInitials}</div>

              <div>
                <strong>{userName}</strong>
                <span>{user?.email ?? 'Conta pessoal'}</span>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-user-menu-item danger"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        )}

        <button
          type="button"
          className={`user-card ${isUserMenuOpen ? 'open' : ''}`}
          onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
          title="Abrir opções da conta"
        >
          <div className="user-avatar">{userInitials}</div>

          {!collapsed && (
            <div>
              <div className="user-name">{userName}</div>
              <div className="user-role">Conta pessoal</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
