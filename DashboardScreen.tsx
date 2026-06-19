import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCondoStore } from '../stores';
import { useDashboardStats, useClientGroups } from '../hooks';
import { WhmcsApi, initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';
import './DashboardScreen.css';

export function DashboardScreen() {
  const navigate = useNavigate();
  const { credentials, logout } = useAuthStore();
  const { selectedCondominio, setSelectedCondominio, condominios } =
    useCondoStore();

  // Crear instancia de API
  const api = React.useMemo(() => {
    if (!credentials) {
      navigate('/login');
      return null;
    }
    return initializeWhmcsApi({
      whmcsUrl: credentials.whmcsUrl,
      username: credentials.username,
      password: credentials.password,
    });
  }, [credentials, navigate]);

  // Obtener datos
  const groupsQuery = useClientGroups(api!);
  const statsQuery = useDashboardStats(api!);

  // Si no hay condominio seleccionado, seleccionar el primero
  useEffect(() => {
    if (!selectedCondominio && condominios.length > 0) {
      setSelectedCondominio(condominios[0]);
    }
  }, [condominios, selectedCondominio, setSelectedCondominio]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!api) {
    return <Loading message="Iniciando..." />;
  }

  if (groupsQuery.isPending || statsQuery.isPending) {
    return (
      <div className="screen">
        <Header title="Dashboard" onAction={handleLogout} actionLabel="Salir" />
        <div className="screen-content">
          <Loading message="Cargando datos..." />
        </div>
      </div>
    );
  }

  if (groupsQuery.isError) {
    return (
      <div className="screen">
        <Header title="Dashboard" onAction={handleLogout} actionLabel="Salir" />
        <div className="screen-content screen-inner">
          <div className="error-message">
            <p>Error cargando dashboard</p>
            <p className="text-secondary">{groupsQuery.error?.message}</p>
            <Button onClick={() => groupsQuery.refetch()} fullWidth className="mt-lg">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header title="Dashboard" onAction={handleLogout} actionLabel="Salir" />

      <div className="screen-content">
        <div className="screen-inner">
          {/* SELECTOR CONDOMINIO */}
          {condominios.length > 1 && (
            <div className="dashboard-selector">
              <label className="dashboard-label">Condominio</label>
              <select
                value={selectedCondominio?.id || ''}
                onChange={(e) => {
                  const condo = condominios.find(
                    (c) => String(c.id) === e.target.value
                  );
                  if (condo) setSelectedCondominio(condo);
                }}
                className="dashboard-select"
              >
                {condominios.map((condo) => (
                  <option key={condo.id} value={condo.id}>
                    {condo.groupname}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* STATS */}
          <h2>Resumen</h2>
          <div className="stats-grid">
            <StatCard
              label="Unidades"
              value={statsQuery.data?.totalClients || 0}
            />
            <StatCard
              label="Pendiente"
              value={`$${(statsQuery.data?.totalPending || 0).toFixed(2)}`}
            />
            <StatCard
              label="Pagado"
              value={`$${(statsQuery.data?.totalPaid || 0).toFixed(2)}`}
            />
            <StatCard
              label="Invoices"
              value={statsQuery.data?.totalInvoices || 0}
            />
          </div>

          {/* QUICK ACTIONS */}
          <div className="actions-grid">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/condominios')}
            >
              Ver Condóminos
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/invoices')}
            >
              Ver Invoices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
