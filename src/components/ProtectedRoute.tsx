import {
    Navigate,
  } from 'react-router-dom';
  
  import {
    useAuth,
  } from '../contexts/AuthContext';
  
  export default function ProtectedRoute({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const {
      user,
      isAuthLoading,
    } = useAuth();
  
    if (isAuthLoading) {
      return (
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-loading">
              Carregando...
            </div>
          </div>
        </div>
      );
    }
  
    if (!user) {
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
  
    return children;
  }