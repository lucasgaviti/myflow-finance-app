import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

import ProtectedRoute from './components/ProtectedRoute';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/monthly-plan"
            element={<MonthlyPlan />}
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/goals"
            element={<Goals />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/planning"
            element={<Planning />}
          />

          <Route
            path="/imports"
            element={<Imports />}
          />

          <Route
            path="/category-rules"
            element={<CategoryRules />}
          />

          <Route
            path="/recurring"
            element={<RecurringTransactions />}
          />

          <Route
            path="*"
            element={
              <Navigate to="/dashboard" />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
