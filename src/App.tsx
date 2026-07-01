import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Login from './pages/Login';
import Transactions from './pages/Transactions';

const protectedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/goals', element: <Goals /> },
];

const disabledRoutes = [
  '/monthly-plan',
  '/planning',
  '/reports',
  '/categories',
  '/imports',
  '/category-rules',
  '/recurring',
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

          {disabledRoutes.map((path) => (
            <Route
              key={path}
              path={path}
              element={<Navigate to="/dashboard" replace />}
            />
          ))}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}