import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useClientDetails, useClientInvoices } from '../hooks';
import { initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { Loading } from '../components/Loading';
import { MailIcon, MapPinIcon } from '../components/Icons';
import './CondominioDetailScreen.css';

export function CondominioDetailScreen() {
  const navigate = useNavigate();
  const { clientid } = useParams<{ clientid: string }>();
  const { token } = useAuthStore();
  const [invoiceFilter, setInvoiceFilter] = useState('Todos');
  const [selectedNav, setSelectedNav] = useState('condominios');

  const api = React.useMemo(() => {
    if (!token) {
      navigate('/login');
      return null;
    }
    return initializeWhmcsApi({
      token: token,
    });
  }, [token, navigate]);

  const detailsQuery = useClientDetails(api!, clientid);
  const invoicesQuery = useClientInvoices(api!, clientid);

  const filteredInvoices = React.useMemo(() => {
    if (!invoicesQuery.data) return [];
    
    let filtered = [...invoicesQuery.data];

    if (invoiceFilter !== 'Todos') {
      filtered = filtered.filter((inv) => inv.status === invoiceFilter);
    }

    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoicesQuery.data, invoiceFilter]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  if (!api) {
    return <Loading message="Iniciando..." />;
  }

  if (!clientid) {
    return (
      <div className="screen">
        <Header 
          title="Detalle Condómino" 
          onBack={() => navigate('/condominios')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <p>Error: No se especificó condómino</p>
        </div>
      </div>
    );
  }

  if (detailsQuery.isPending || invoicesQuery.isPending) {
    return (
      <div className="screen">
        <Header 
          title="Detalle Condómino" 
          onBack={() => navigate('/condominios')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando detalles..." />
        </div>
      </div>
    );
  }

  if (detailsQuery.isError) {
    return (
      <div className="screen">
        <Header 
          title="Detalle Condómino" 
          onBack={() => navigate('/condominios')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <div className="error-message">
            <p>Error cargando detalles</p>
            <p className="text-secondary">{detailsQuery.error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const cliente = detailsQuery.data;

  if (!cliente) {
    return (
      <div className="screen">
        <Header 
          title="Detalle Condómino" 
          onBack={() => navigate('/condominios')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <p>No se encontró el condómino (ID: {clientid})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header 
        title="Detalle Condómino" 
        onBack={() => navigate('/condominios')}
        onAction={handleLogout}
        actionLabel="Salir"
      />

      <div className="screen-content">
        <div className="screen-inner">
          <Card className="detail-profile">
            <div className="profile-header">
              <Avatar 
                name={`${cliente.firstname} ${cliente.lastname}`}
                size="lg"
              />
              <div className="profile-info">
                <h2 className="profile-name">
                  {cliente.firstname} {cliente.lastname}
                </h2>
                <Badge variant={cliente.status === 'Active' ? 'success' : 'warning'}>
                  {cliente.status}
                </Badge>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <div className="detail-icon">
                  <MailIcon size={20} />
                </div>
                <div>
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{cliente.email}</div>
                </div>
              </div>

              {cliente.address1 && (
                <div className="detail-row">
                  <div className="detail-icon">
                    <MapPinIcon size={20} />
                  </div>
                  <div>
                    <div className="detail-label">Dirección</div>
                    <div className="detail-value">{cliente.address1}</div>
                  </div>
                </div>
              )}

              {cliente.city && (
                <div className="detail-row">
                  <div className="detail-label">Ciudad</div>
                  <div className="detail-value">{cliente.city}</div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-label">Crédito disponible</div>
                <div className="detail-value">${parseFloat(cliente.credit || '0').toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <h3 className="section-title">Facturas</h3>

          <div className="invoices-filters">
            {['Todos', 'Paid', 'Unpaid', 'Overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setInvoiceFilter(status)}
                className={`filter-btn ${invoiceFilter === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="invoices-list">
            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <p>No hay facturas para mostrar</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="invoice-card">
                  <div className="invoice-header">
                    <div>
                      <h4 className="invoice-num">{invoice.invoicenum}</h4>
                      <p className="invoice-date">
                        {new Date(invoice.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="invoice-amount">
                      <span className="amount">${parseFloat(invoice.total || '0').toFixed(2)}</span>
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
                  </div>
                  {invoice.notes && (
                    <p className="invoice-description">{invoice.notes}</p>
                  )}
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
        }}
      />
    </div>
  );
}