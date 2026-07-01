import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, LogOut, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import ThemeToggle from './ThemeToggle';

import { useAuth } from '../contexts/AuthContext';
import { notifyError, notifySuccess } from '../lib/toast';

type TopbarProps = {
  onNewTransaction: () => void;
};

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Financeiro',
  '/transactions': 'Transações',
  '/goals': 'Metas',
};

function getUserInitials(email?: string | null) {
  if (!email) {
    return 'US';
  }

  const [name] = email.split('@');

  return name.slice(0, 2).toUpperCase();
}

export default function Topbar({ onNewTransaction }: TopbarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userEmail = user?.email ?? 'Usuário';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'MyFlow Finance';

  const userInitials = useMemo(() => getUserInitials(user?.email), [user?.email]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldUseDarkMode = savedTheme === 'dark';

    document.body.classList.toggle('dark', shouldUseDarkMode);
    setDarkMode(shouldUseDarkMode);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedNotifications =
        notificationsRef.current?.contains(target) ?? false;

      const clickedUserMenu = userMenuRef.current?.contains(target) ?? false;

      if (!clickedNotifications) {
        setShowNotifications(false);
      }

      if (!clickedUserMenu) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function toggleTheme() {
    const isDark = !darkMode;

    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setDarkMode(isDark);
  }

  function handleNewTransaction() {
    setShowNotifications(false);
    setShowUserMenu(false);
    onNewTransaction();
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      notifySuccess('Sessão encerrada com sucesso.');
    } catch {
      notifyError('Não foi possível sair da conta.');
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{pageTitle}</h2>
      </div>

      <div className="topbar-right">
        <ThemeToggle
          darkMode={darkMode}
          onToggle={toggleTheme}
          disabled={isLoggingOut}
        />

        <div className="topbar-menu-wrapper" ref={notificationsRef}>
          <button
            type="button"
            className="icon-btn"
            title="Notificações"
            aria-label="Abrir notificações"
            aria-haspopup="menu"
            aria-expanded={showNotifications}
            disabled={isLoggingOut}
            onClick={() => {
              setShowNotifications((currentState) => !currentState);
              setShowUserMenu(false);
            }}
          >
            <Bell size={18} />
          </button>

          {showNotifications && (
            <div className="topbar-dropdown" role="menu">
              <strong>Notificações</strong>
              <p>Nenhuma notificação no momento.</p>
            </div>
          )}
        </div>

        <button
          type="button"
          className="primary-btn"
          disabled={isLoggingOut}
          onClick={handleNewTransaction}
        >
          <Plus size={18} />
          Nova transação
        </button>

        <div className="topbar-menu-wrapper" ref={userMenuRef}>
          <button
            type="button"
            className="topbar-avatar"
            title="Menu do usuário"
            aria-label="Abrir menu do usuário"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            disabled={isLoggingOut}
            onClick={() => {
              setShowUserMenu((currentState) => !currentState);
              setShowNotifications(false);
            }}
          >
            {userInitials}
          </button>

          {showUserMenu && (
            <div className="topbar-dropdown user-dropdown" role="menu">
              <strong>{userEmail}</strong>
              <p>Conta conectada</p>

              <button
                type="button"
                className="logout-btn"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}