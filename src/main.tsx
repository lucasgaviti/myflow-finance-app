import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';

import './styles/global.css';

const savedTheme = window.localStorage.getItem('myflow-theme') || window.localStorage.getItem('theme');
document.body.classList.toggle('dark', savedTheme === 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
);