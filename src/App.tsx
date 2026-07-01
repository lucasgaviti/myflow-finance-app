import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import { Planning } from './pages/Planning';
import Imports from './pages/Imports';
import CategoryRules from './pages/CategoryRules';
import RecurringTransactions from './pages/RecurringTransactions';
import MonthlyPlan from './pages/MonthlyPlan';

const protectedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/monthly-plan', element: <MonthlyPlan /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/categories', element: <Categories /> },
  { path: '/goals', element: <Goals /> },
  { path: '/reports', element: <Reports /> },
  { path: '/planning', element: <Planning /> },
  { path: '/imports', element: <Imports /> },
  { path: '/category-rules', element: <CategoryRules /> },
  { path: '/recurring', element: <RecurringTransactions /> },
];

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {protectedRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}