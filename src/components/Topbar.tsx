import { Bell, LogOut, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { notifyError, notifySuccess } from '../lib/toast';
import ThemeToggle from './ThemeToggle';

type TopbarProps = {
  onNewTransaction?: () => void;
};

type UserMetadata = {
  full_name?: string;
  name?: string;
  display_name?: string;
};

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Financeiro',
  '/monthly-plan': 'Planejamento Mensal',
  '/transactions': 'Transações',
  '/goals': 'Metas',
};

function getUserDisplayName(
  email?: string | null,
  metadata?: UserMetadata | null,
) {
  const metadataName =
    metadata?.full_name?.trim() ||
    metadata?.name?.trim() ||
    metadata?.display_name?.trim();

  if (metadataName) {
    return metadataName;
  }

  if (email) {
    return email.split('@')[0];
  }

  return 'Usuário';
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

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return false;
  }

  const savedTheme =
    window.localStorage.getItem('myflow-theme') ||
    window.localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    return true;
  }

  if (savedTheme === 'light') {
    return false;
  }

  return document.body.classList.contains('dark');
}

export default function Topbar({ onNewTransaction }: TopbarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'MyFlow Finance';

  const userMetadata = user?.user_metadata as UserMetadata | undefined;

  const userName = useMemo(
    () => getUserDisplayName(user?.email, userMetadata),
    [user?.email, userMetadata],
  );

  const userInitials = useMemo(() => getUserInitials(userName), [userName]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    window.localStorage.setItem('myflow-theme', darkMode ? 'dark' : 'light');
    window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  function handleToggleTheme() {
    setDarkMode((current) => !current);
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      await signOut();
      notifySuccess('Sessão encerrada com sucesso.');
    } catch {
      notifyError('Não foi possível sair da conta agora.');
      setIsSigningOut(false);
    }
  }

  function handleToggleNotifications() {
    setIsNotificationsOpen((current) => !current);
    setIsUserMenuOpen(false);
  }

  function handleToggleUserMenu() {
    setIsUserMenuOpen((current) => !current);
    setIsNotificationsOpen(false);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-right">
        <ThemeToggle darkMode={darkMode} onToggle={handleToggleTheme} />

        <div className="topbar-menu-wrapper">
          <button
            type="button"
            className="icon-btn"
            onClick={handleToggleNotifications}
            aria-label="Abrir notificações"
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={18} />
          </button>

          {isNotificationsOpen && (
            <div className="topbar-dropdown">
              <strong>Notificações</strong>
              <p>
                Nenhuma notificação importante no momento. Os próximos alertas
                do planejamento aparecerão aqui.
              </p>
            </div>
          )}
        </div>

        {onNewTransaction && (
          <button
            type="button"
            className="primary-btn"
            onClick={onNewTransaction}
          >
            <Plus size={16} />
            Nova transação
          </button>
        )}

        <div className="topbar-menu-wrapper">
          <button
            type="button"
            className="topbar-avatar"
            onClick={handleToggleUserMenu}
            aria-label="Abrir menu da conta"
            aria-expanded={isUserMenuOpen}
          >
            {userInitials}
          </button>

          {isUserMenuOpen && (
            <div className="topbar-dropdown user-dropdown">
              <strong>{userName}</strong>
              <p>{user?.email ?? 'Conta pessoal'}</p>

              <button
                type="button"
                className="logout-btn"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut size={16} />
                {isSigningOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}