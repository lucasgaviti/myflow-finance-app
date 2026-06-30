import {
  useState,
} from 'react';

import {
  Menu,
  X,
} from 'lucide-react';

import { Outlet } from 'react-router-dom';

import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  return (
    <div className="layout">
      <button
        className="mobile-menu-btn"
        onClick={() =>
          setMobileOpen(
            !mobileOpen,
          )
        }
      >
        {mobileOpen ? (
          <X size={22} />
        ) : (
          <Menu size={22} />
        )}
      </button>

      {mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() =>
          setCollapsed(
            !collapsed,
          )
        }
        mobileOpen={mobileOpen}
        onCloseMobile={() =>
          setMobileOpen(false)
        }
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}