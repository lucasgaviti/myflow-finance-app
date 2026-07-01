import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    setCollapsed((currentState) => !currentState);
  }

  function toggleMobileMenu() {
    setMobileOpen((currentState) => !currentState);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <div className="layout">
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label={mobileOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={mobileOpen}
        onClick={toggleMobileMenu}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Fechar menu lateral"
          onClick={closeMobileMenu}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleSidebar}
        onCloseMobile={closeMobileMenu}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}