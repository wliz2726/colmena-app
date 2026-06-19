import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useTickets, useTicketCounts } from '../hooks';
import { initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { Loading } from '../components/Loading';
import { TicketIcon } from '../components/Icons';
import './TicketsScreen.css';

export function TicketsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined);
  const [selectedNav, setSelectedNav] = useState('tickets');

  // Sincronizar selectedNav con la ruta actual
  useEffect(() => {
    setSelectedNav('tickets');
  }, [location.pathname]);

  const api = React.useMemo(() => {
    const { token } = useAuthStore.getState();
    if (!token) {
      navigate('/login');
      return null;
    }
    return initializeWhmcsApi({ token });
  }, [navigate]);

  // TODO: Implementar GetDepartments en WHMCS
  // Por ahora, sin selector de departamentos
  const departmentsQuery = { 
    data: [], 
    isPending: false, 
    isError: false 
  };

  // Traer tickets del departamento seleccionado (o todos si no hay seleccionado)
  const ticketsQuery = useTickets(api, {
    departmentid: selectedDepartment,
    limit: 50,
  });

  // Traer conteos
  const countsQuery = useTicketCounts(api, selectedDepartment);

  const filteredTickets = React.useMemo(() => {
    if (!ticketsQuery.data) return [];

    let filtered = [...ticketsQuery.data];

    if (filterStatus !== 'Todos') {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.datecreated).getTime();
      const dateB = new Date(b.datecreated).getTime();
      return dateB - dateA;
    });
  }, [ticketsQuery.data, filterStatus]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
      case 'In Progress':
        return 'warning';
      case 'Answered':
      case 'Customer-Reply':
        return 'info';
      case 'On Hold':
        return 'secondary';
      case 'Closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'danger';
      case 'Urgent':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (!api) {
    return <Loading message="Iniciando..." />;
  }

  if (departmentsQuery.isPending) {
    return (
      <div className="screen">
        <Header
          title="Tickets"
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando departamentos..." />
        </div>
      </div>
    );
  }

  if (ticketsQuery.isPending) {
    return (
      <div className="screen">
        <Header
          title="Tickets"
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando tickets..." />
        </div>
      </div>
    );
  }

  if (ticketsQuery.isError) {
    return (
      <div className="screen">
        <Header
          title="Tickets"
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <div className="error-message">
            <p>Error cargando tickets</p>
            <p className="text-secondary">{ticketsQuery.error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const departments = departmentsQuery.data || [];

  return (
    <div className="screen">
      <Header
        title="Tickets"
        onBack={() => navigate('/dashboard')}
        onAction={handleLogout}
        actionLabel="Salir"
      />

      <div className="screen-content">
        <div className="screen-inner">
          {/* SELECTOR DE DEPARTAMENTOS */}
          {/*departments.length > 0 && (
            <div className="department-selector">
              <button
                className={`dept-btn ${selectedDepartment === undefined ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(undefined)}
              >
                Todos
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  className={`dept-btn ${selectedDepartment === dept.id ? 'active' : ''}`}
                  onClick={() => setSelectedDepartment(dept.id)}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          )*/}

          {/* CONTEOS */}
          {countsQuery.data && (
            <Card className="tickets-summary">
              <div className="summary-row">
                <div className="summary-item">
                  <span className="summary-label">Abiertos</span>
                  <span className="summary-value">{countsQuery.data.open}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Respondidos</span>
                  <span className="summary-value">{countsQuery.data.answered}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">En espera</span>
                  <span className="summary-value">{countsQuery.data.onhold}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cerrados</span>
                  <span className="summary-value">{countsQuery.data.closed}</span>
                </div>
              </div>
            </Card>
          )}

          {/* FILTROS POR ESTADO */}
          <div className="tickets-filters">
            {['Todos', 'Open', 'Answered', 'Customer-Reply', 'On Hold', 'Closed'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              )
            )}
          </div>

          {/* LISTA DE TICKETS */}
          <div className="tickets-list">
            {filteredTickets.length === 0 ? (
              <div className="empty-state">
                <TicketIcon size={48} color="#D1D5DB" />
                <p>No hay tickets para mostrar</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="ticket-item"
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ticket-content">
                    <div className="ticket-left">
                      <h4 className="ticket-id">{ticket.tid}</h4>
                      <p className="ticket-subject">{ticket.title}</p>
                      <p className="ticket-client">{ticket.name}</p>
                      <p className="ticket-date">
                        Creado: {new Date(ticket.datecreated).toLocaleDateString('es-ES')}
                      </p>
                      {ticket.lastreply && ticket.lastreply !== '0000-00-00 00:00:00' && (
                        <p className="ticket-lastreply">
                          Última respuesta:{' '}
                          {new Date(ticket.lastreply).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>

                    <div className="ticket-right">
                      <div className="ticket-badges">
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        {ticket.priority && (
                          <Badge variant={getPriorityColor(ticket.priority)} size="sm">
                            {ticket.priority}
                          </Badge>
                        )}
                      </div>
                      {ticket.deptname && (
                        <p className="ticket-dept">{ticket.deptname}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
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
          else if (nav === 'tickets') navigate('/tickets');
        }}
      />
    </div>
  );
}