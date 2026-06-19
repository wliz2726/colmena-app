import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CondominiosScreen } from './screens/CondominiosScreen';
import { CondominioDetailScreen } from './screens/CondominioDetailScreen';
import { InvoicesScreen } from './screens/InvoicesScreen';

function App() {
  const { isAuthenticated, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginScreen />}
        />

        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/condominios" element={<CondominiosScreen />} />
            <Route path="/condominios/:clientid" element={<CondominioDetailScreen />} />
            <Route path="/invoices" element={<InvoicesScreen />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </>
        ) : (
          <>
            <Route path="/*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;