import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Login from './pages/Login';
import MonthlyPlan from './pages/MonthlyPlan';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monthly-plan" element={<MonthlyPlan />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/goals" element={<Goals />} />

          <Route path="/planning" element={<Navigate to="/monthly-plan" replace />} />
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/categories" element={<Navigate to="/dashboard" replace />} />
          <Route path="/imports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/category-rules" element={<Navigate to="/dashboard" replace />} />
          <Route path="/recurring" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}