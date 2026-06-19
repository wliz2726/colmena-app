import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../stores';
import { useTicketDetail, useTicketNotes } from '../hooks';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { Loading } from '../components/Loading';
import { AttachmentIcon } from '../components/Icons';
import './TicketDetailScreen.css';

export function TicketDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticketid } = useParams<{ ticketid: string }>();
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

    // Crear axios para /api/proxy
    return axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }) as AxiosInstance;
  }, [navigate]);

  const ticketQuery = useTicketDetail(api, ticketid);
  const notesQuery = useTicketNotes(api, ticketid);

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

  if (!ticketid) {
    return (
      <div className="screen">
        <Header
          title="Detalle Ticket"
          onBack={() => navigate('/tickets')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <p>Error: No se especificó ticket</p>
        </div>
      </div>
    );
  }

  if (ticketQuery.isPending) {
    return (
      <div className="screen">
        <Header
          title="Detalle Ticket"
          onBack={() => navigate('/tickets')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando detalles..." />
        </div>
      </div>
    );
  }

  if (ticketQuery.isError) {
    return (
      <div className="screen">
        <Header
          title="Detalle Ticket"
          onBack={() => navigate('/tickets')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <div className="error-message">
            <p>Error cargando ticket</p>
            <p className="text-secondary">{ticketQuery.error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const ticket = ticketQuery.data;
  const notes = notesQuery.data || [];

  if (!ticket) {
    return (
      <div className="screen">
        <Header
          title="Detalle Ticket"
          onBack={() => navigate('/tickets')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <p>No se encontró el ticket (ID: {ticketid})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header
        title={`Ticket ${ticket.tid}`}
        onBack={() => navigate('/tickets')}
        onAction={handleLogout}
        actionLabel="Salir"
      />

      <div className="screen-content">
        <div className="screen-inner">
          {/* ENCABEZADO */}
          <Card className="ticket-header-card">
            <div className="ticket-header">
              <div>
                <h2 className="ticket-title">{ticket.title}</h2>
                <p className="ticket-client-info">
                  De: <strong>{ticket.name}</strong> ({ticket.email})
                </p>
              </div>
            </div>

            <div className="ticket-info-grid">
              <div className="info-item">
                <span className="info-label">Ticket ID</span>
                <span className="info-value">{ticket.tid}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado</span>
                <Badge variant={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
              {ticket.priority && (
                <div className="info-item">
                  <span className="info-label">Prioridad</span>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Departamento</span>
                <span className="info-value">{ticket.deptname || ticket.department}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Creado</span>
                <span className="info-value">
                  {new Date(ticket.datecreated).toLocaleDateString('es-ES')}
                </span>
              </div>
              {ticket.lastreply && ticket.lastreply !== '0000-00-00 00:00:00' && (
                <div className="info-item">
                  <span className="info-label">Última respuesta</span>
                  <span className="info-value">
                    {new Date(ticket.lastreply).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* CONVERSACIÓN */}
          <h3 className="section-title">Conversación</h3>

          {notesQuery.isPending ? (
            <Loading message="Cargando notas..." />
          ) : notesQuery.isError ? (
            <div className="error-message">
              <p>Error cargando notas</p>
              <p className="text-secondary">{notesQuery.error?.message}</p>
            </div>
          ) : notes.length === 0 ? (
            <Card className="empty-notes">
              <p>No hay notas en este ticket</p>
            </Card>
          ) : (
            <div className="notes-list">
              {notes.map((note, index) => (
                <Card key={index} className="note-card">
                  <div className="note-header">
                    <div className="note-author">
                      <strong>{note.name}</strong>
                      <span className="note-email">{note.email}</span>
                    </div>
                    <span className="note-date">
                      {new Date(note.datecreated).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="note-message">
                    <p>{note.message}</p>
                  </div>

                  {note.attachment && note.attachment.length > 0 && (
                    <div className="note-attachments">
                      <h4 className="attachments-title">
                        <AttachmentIcon size={16} /> Adjuntos
                      </h4>
                      {note.attachment.map((att) => (
                        <div key={att.id} className="attachment-item">
                          <AttachmentIcon size={16} />
                          <span className="attachment-name">{att.filename}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* NOTA: Fase 2 */}
          <Card className="phase-2-note">
            <p className="text-secondary">
              💡 <strong>Responder a este ticket</strong> estará disponible en la próxima versión
              (Fase 2)
            </p>
          </Card>

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