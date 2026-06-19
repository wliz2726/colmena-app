import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './hooks';
import { useAuthStore } from './stores';

// Importar estilos
import './styles/global.css';
import './App.css';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CondominiosScreen } from './screens/CondominiosScreen';
import { CondominioDetailScreen } from './screens/CondominioDetailScreen';
import { InvoicesScreen } from './screens/InvoicesScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuthStore();

  // Si aún está cargando, mostrar loading
  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { loadFromStorage, loading } = useAuthStore();

  // Cargar sesión al montar la app
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Mostrar loading global mientras se restaura sesión
  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>Inicializando Colmena...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN - sin protección */}
      <Route path="/login" element={<LoginScreen />} />

      {/* RUTAS PROTEGIDAS */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominios"
        element={
          <ProtectedRoute>
            <CondominiosScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominios/:clientid"
        element={
          <ProtectedRoute>
            <CondominioDetailScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoicesScreen />
          </ProtectedRoute>
        }
      />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;