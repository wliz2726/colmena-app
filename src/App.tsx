import React from 'react';
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
  const { credentials } = useAuthStore();
  return credentials ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;