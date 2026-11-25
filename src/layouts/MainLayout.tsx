import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Receipt, Plus, CalendarDays, Target } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  return <div className="layout">
    <Sidebar collapsed={collapsed} mobileOpen={false} onToggleCollapse={() => setCollapsed(v => !v)} onCloseMobile={() => {}} />
    <main className="main-content"><Outlet /></main>
    <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
      <NavLink to="/dashboard"><Home size={21}/><span>Início</span></NavLink>
      <NavLink to="/transactions"><Receipt size={21}/><span>Transações</span></NavLink>
      <button type="button" className="mobile-new" aria-label="Nova transação" onClick={() => navigate('/transactions', { state: { newTransaction: true } })}><Plus size={25}/></button>
      <NavLink to="/monthly-plan"><CalendarDays size={21}/><span>Plano</span></NavLink>
      <NavLink to="/goals"><Target size={21}/><span>Metas</span></NavLink>
    </nav>
  </div>;
}
