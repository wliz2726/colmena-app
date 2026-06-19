import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useClients, useInvoices } from '../hooks';
import { initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { Loading } from '../components/Loading';
import { BuildingIcon } from '../components/Icons';
import './CondominiosScreen.css';

export function CondominiosScreen() {
  const navigate = useNavigate();
  const { credentials } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('Todos');
  const [selectedNav, setSelectedNav] = useState('condominios');

  const api = React.useMemo(() => {
    if (!credentials) {
      navigate('/login');
      return null;
    }
    return initializeWhmcsApi({
      whmcsUrl: credentials.whmcsUrl,
      identifier: credentials.identifier,
      secret: credentials.secret,
    });
  }, [credentials, navigate]);

  const clientsQuery = useClients(api!, undefined);
  const invoicesQuery = useInvoices(api!, { limit: 500 });

  // Función para determinar estado de pago
  const getPaymentStatus = (clientId: number, invoices: any[]) => {
    const clientInvoices = invoices.filter(inv => inv.userid === clientId);
    
    if (clientInvoices.length === 0) return 'Al día';

    const unpaidInvoices = clientInvoices.filter(
      inv => inv.status === 'Unpaid' || inv.status === 'Overdue'
    );

    if (unpaidInvoices.length === 0) return 'Al día';

    const now = new Date();
    const overdueInvoices = unpaidInvoices.filter(inv => {
      const dueDate = new Date(inv.duedate);
      return dueDate < now;
    });

    if (overdueInvoices.length > 0) return 'Moroso';
    return 'Pendiente';
  };

  // Filtrar clientes por búsqueda y estado de pago
  const filteredClients = useMemo(() => {
    if (!clientsQuery.data || !invoicesQuery.data) return [];

    let filtered = clientsQuery.data.filter(client => {
      const fullName = `${client.firstname} ${client.lastname}`;
      const email = client.email || '';
      const companyName = client.companyname || '';
      
      const matchesSearch =
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        companyName.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterPayment !== 'Todos') {
        const status = getPaymentStatus(client.id, invoicesQuery.data);
        return status === filterPayment;
      }

      return true;
    });

    return filtered.sort((a, b) =>
      `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`)
    );
  }, [clientsQuery.data, invoicesQuery.data, search, filterPayment]);

  // Contar estadísticas
  const stats = useMemo(() => {
    if (!clientsQuery.data || !invoicesQuery.data) 
      return { todos: 0, alDia: 0, pendientes: 0, morosos: 0 };

    const counts = {
      todos: clientsQuery.data.length,
      alDia: 0,
      pendientes: 0,
      morosos: 0,
    };

    clientsQuery.data.forEach(client => {
      const status = getPaymentStatus(client.id, invoicesQuery.data);
      if (status === 'Al día') counts.alDia++;
      else if (status === 'Pendiente') counts.pendientes++;
      else if (status === 'Moroso') counts.morosos++;
    });

    return counts;
  }, [clientsQuery.data, invoicesQuery.data]);

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
          title="Condominios" 
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando condominios..." />
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header 
        title="Condominios" 
        onBack={() => navigate('/dashboard')}
        onAction={handleLogout}
        actionLabel="Salir"
      />

      <div className="screen-content">
        <div className="screen-inner">
          {/* TÍTULO */}
          <div className="condominios-header">
            <h2 className="condominios-title">Condóminos</h2>
            <p className="condominios-subtitle">Mostrando condóminos de todos los condominios.</p>
          </div>

          {/* BÚSQUEDA */}
          <div className="condominios-search">
            <input
              type="text"
              placeholder="Buscar por nombre, email o condominio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* FILTROS DE PAGO */}
          <div className="condominios-filters">
            <button
              onClick={() => setFilterPayment('Todos')}
              className={`filter-btn ${filterPayment === 'Todos' ? 'active' : ''}`}
            >
              Todos <span className="filter-count">{stats.todos}</span>
            </button>
            <button
              onClick={() => setFilterPayment('Al día')}
              className={`filter-btn ${filterPayment === 'Al día' ? 'active' : ''}`}
            >
              Al día <span className="filter-count">{stats.alDia}</span>
            </button>
            <button
              onClick={() => setFilterPayment('Pendiente')}
              className={`filter-btn ${filterPayment === 'Pendiente' ? 'active' : ''}`}
            >
              Pendientes <span className="filter-count">{stats.pendientes}</span>
            </button>
            <button
              onClick={() => setFilterPayment('Moroso')}
              className={`filter-btn ${filterPayment === 'Moroso' ? 'active' : ''}`}
            >
              Morosos <span className="filter-count">{stats.morosos}</span>
            </button>
          </div>

          {/* TABLA */}
          <div className="condominios-table-container">
            <table className="condominios-table">
              <thead>
                <tr>
                  <th>Condómino</th>
                  <th>Condominio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty">
                      <div className="empty-state">
                        <BuildingIcon size={48} color="#D1D5DB" />
                        <p>No hay condominios para mostrar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const paymentStatus = getPaymentStatus(client.id, invoicesQuery.data || []);
                    return (
                      <tr 
                        key={client.id} 
                        onClick={() => navigate(`/condominios/${client.id}`)}
                        className="table-row"
                      >
                        <td className="cell-name">
                          <div className="cell-content">
                            <Avatar 
                              name={`${client.firstname} ${client.lastname}`} 
                              size="sm" 
                            />
                            <div className="cell-info">
                              <div className="name">
                                {client.firstname} {client.lastname}
                              </div>
                              <div className="email">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{client.companyname || '-'}</td>
                        <td className="cell-status">
                          <Badge 
                            variant={
                              paymentStatus === 'Al día' ? 'success' :
                              paymentStatus === 'Pendiente' ? 'warning' : 'danger'
                            }
                            size="sm"
                          >
                            {paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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