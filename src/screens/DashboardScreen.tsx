import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useClients, useInvoices } from '../hooks';
import { initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { BottomNav } from '../components/BottomNav';
import {
  BuildingIcon,
  InvoiceIcon,
  DollarIcon,
  AlertIcon,
  BellIcon,
  ArrowRightIcon,
} from '../components/Icons';
import './DashboardScreen.css';

// Simple sparkline generator
const generateSparkline = (min: number, max: number, points: number = 7) => {
  return Array.from({ length: points }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};

// Función para filtrar por período
const filterByPeriod = (invoices: any[], period: string) => {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'all':
      return invoices;
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'thisMonth':
      startDate.setDate(1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= startDate && invDate <= endOfLastMonth;
      });
    case 'custom':
      return invoices;
    default:
      return invoices;
  }

  return invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate >= startDate && invDate <= now;
  });
};

export function DashboardScreen() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [selectedNav, setSelectedNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState('7days');

  // Obtener nombre del admin (por defecto)
  const adminName = 'Administrador';

  const api = React.useMemo(() => {
    const { token } = useAuthStore.getState();
    if (!token) {
      navigate('/login');
      return null;
    }
    return initializeWhmcsApi({
      token,
    });
  }, [navigate]);

  const clientsQuery = useClients(api!, undefined);
  const invoicesQuery = useInvoices(api!, { limit: 200 });

  // Filtrar invoices por período
  const filteredInvoices = useMemo(() => {
    if (!invoicesQuery.data) return [];
    return filterByPeriod(invoicesQuery.data, period);
  }, [invoicesQuery.data, period]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  if (!api) {
    return <Loading message="Iniciando..." />;
  }

  if (clientsQuery.isPending || invoicesQuery.isPending) {
    return (
      <div className="screen">
        <Header 
          title="Dashboard"
          showMenu={true}
          onMenuClick={() => setSidebarOpen(true)}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando datos..." />
        </div>
      </div>
    );
  }

  // Calcular estadísticas con datos filtrados
  const clientes = clientsQuery.data || [];
  const invoices = filteredInvoices;

  const totalInvoices = invoices.length;
  const paidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

  const activeClients = clientes.filter(c => c.status === 'Active').length;
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const invoicesByStatus = {
    paid: invoices.filter(i => i.status === 'Paid').length,
    unpaid: invoices.filter(i => i.status === 'Unpaid').length,
    overdue: invoices.filter(i => i.status === 'Overdue').length,
  };

  const notificationCount = invoicesByStatus.overdue;

  return (
    <div className="screen">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminName={adminName}
      />

      <Header 
        title="" 
        showLogo={true}
        showMenu={true}
        onMenuClick={() => setSidebarOpen(true)}
        notificationCount={notificationCount}
      />

      <div className="screen-content">
        <div className="screen-inner">
          {/* SALUDO CON NOMBRE DEL ADMIN */}
          <div className="dashboard-greeting">
            <div>
              <h1 className="greeting-title">¡Hola, {adminName}! 👋</h1>
              <p className="greeting-subtitle">Aquí tienes el resumen general de tu gestión</p>
            </div>
          </div>

          {/* FILTRO DE FECHAS */}
          <div className="date-filter">
            <label>Período:</label>
            <select 
              className="date-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">Todo</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="thisMonth">Este mes</option>
              <option value="lastMonth">Mes anterior</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* STAT CARDS */}
          <div className="stats-grid">
            <StatCard
              icon={<BuildingIcon size={32} />}
              label="Condominios"
              value={activeClients}
              change={9}
              spark={generateSparkline(8, 15)}
              color="#7C3AED"
            />
            <StatCard
              icon={<InvoiceIcon size={32} />}
              label="Facturas emitidas"
              value={totalInvoices}
              change={15}
              spark={generateSparkline(30, 50)}
              color="#10B981"
            />
            <StatCard
              icon={<DollarIcon size={32} />}
              label="Pagos recibidos"
              value={`$${paidAmount.toFixed(2)}`}
              change={21}
              spark={generateSparkline(1000, 5000)}
              color="#3B82F6"
            />
            <StatCard
              icon={<AlertIcon size={32} />}
              label="Pendientes de pago"
              value={`$${pendingAmount.toFixed(2)}`}
              change={-8}
              spark={generateSparkline(5000, 35000)}
              color="#F59E0B"
            />
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="section">
            <h3 className="section-title">Acciones rápidas</h3>
            <div className="quick-actions">
              <Card
                variant="interactive"
                className="quick-action-btn"
                onClick={() => { setSelectedNav('condominios'); navigate('/condominios'); }}
              >
                <BuildingIcon size={28} color="#7C3AED" />
                <span>Condominios</span>
              </Card>
              <Card
                variant="interactive"
                className="quick-action-btn"
                onClick={() => { setSelectedNav('invoices'); navigate('/invoices'); }}
              >
                <InvoiceIcon size={28} color="#10B981" />
                <span>Facturas</span>
              </Card>
              <Card
                variant="interactive"
                className="quick-action-btn"
                onClick={() => { setSelectedNav('invoices'); navigate('/invoices'); }}
              >
                <DollarIcon size={28} color="#3B82F6" />
                <span>Pagos</span>
              </Card>
              <Card
                variant="interactive"
                className="quick-action-btn"
              >
                <BellIcon size={28} color="#EC4899" />
                <span>Comunicados</span>
              </Card>
            </div>
          </div>

          {/* GRÁFICOS */}
          <div className="charts-section">
            <Card className="chart-card">
              <h4 className="chart-title">Estado de facturas</h4>
              <div className="invoice-status">
                <div className="status-item">
                  <div className="status-badge" style={{ backgroundColor: '#10B981' }}>
                    {invoicesByStatus.paid}
                  </div>
                  <span className="status-label">Pagadas</span>
                  <span className="status-percent">
                    {totalInvoices > 0 ? ((invoicesByStatus.paid / totalInvoices) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="status-item">
                  <div className="status-badge" style={{ backgroundColor: '#F59E0B' }}>
                    {invoicesByStatus.unpaid}
                  </div>
                  <span className="status-label">Pendientes</span>
                  <span className="status-percent">
                    {totalInvoices > 0 ? ((invoicesByStatus.unpaid / totalInvoices) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="status-item">
                  <div className="status-badge" style={{ backgroundColor: '#EF4444' }}>
                    {invoicesByStatus.overdue}
                  </div>
                  <span className="status-label">Vencidas</span>
                  <span className="status-percent">
                    {totalInvoices > 0 ? ((invoicesByStatus.overdue / totalInvoices) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* FACTURAS RECIENTES */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Facturas recientes</h3>
              <button 
                className="section-link"
                onClick={() => { setSelectedNav('invoices'); navigate('/invoices'); }}
              >
                Ver todas <ArrowRightIcon size={16} />
              </button>
            </div>

            <div className="recent-items">
              {recentInvoices.length === 0 ? (
                <p className="empty-message">No hay facturas en este período</p>
              ) : (
                recentInvoices.map((invoice) => (
                  <Card key={invoice.id} className="recent-item">
                    <div className="recent-left">
                      <Avatar name={`${invoice.firstname || ''} ${invoice.lastname || ''}`} size="md" />
                      <div className="recent-info">
                        <h4 className="recent-name">
                          {invoice.firstname} {invoice.lastname}
                        </h4>
                        <p className="recent-detail">{invoice.invoicenum}</p>
                      </div>
                    </div>
                    <div className="recent-right">
                      <span className="recent-amount">${parseFloat(invoice.total || '0').toFixed(2)}</span>
                      <Badge 
                        variant={
                          invoice.status === 'Paid' ? 'success' :
                          invoice.status === 'Overdue' ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div style={{ height: 100 }}></div>
        </div>
      </div>

      <BottomNav 
        active={selectedNav}
        onChange={setSelectedNav}
        onNavigate={(nav) => {
          if (nav === 'dashboard') navigate('/dashboard');
          else if (nav === 'condominios') navigate('/condominios');
          else if (nav === 'invoices') navigate('/invoices');
        }}
      />
    </div>
  );
}