import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { useInvoices } from '../hooks';
import { initializeWhmcsApi } from '../whmcsApi';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { Loading } from '../components/Loading';
import { InvoiceIcon } from '../components/Icons';
import './InvoicesScreen.css';

export function InvoicesScreen() {
  const navigate = useNavigate();
  const { credentials } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedNav, setSelectedNav] = useState('invoices');

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

  const invoicesQuery = useInvoices(api!, { limit: 200 });

  // Filtrar invoices por estado
  const filteredInvoices = React.useMemo(() => {
    if (!invoicesQuery.data) return [];
    
    let filtered = [...invoicesQuery.data];

    if (filterStatus !== 'Todos') {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoicesQuery.data, filterStatus]);

  // Calcular totales
  const totals = React.useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => 
      sum + parseFloat(inv.total || '0'), 0
    );
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const pendingAmount = filteredInvoices
      .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

    return { totalAmount, paidAmount, pendingAmount };
  }, [filteredInvoices]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  if (!api) {
    return <Loading message="Iniciando..." />;
  }

  if (invoicesQuery.isPending) {
    return (
      <div className="screen">
        <Header 
          title="Facturas" 
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content">
          <Loading message="Cargando facturas..." />
        </div>
      </div>
    );
  }

  if (invoicesQuery.isError) {
    return (
      <div className="screen">
        <Header 
          title="Facturas" 
          onBack={() => navigate('/dashboard')}
          onAction={handleLogout}
          actionLabel="Salir"
        />
        <div className="screen-content screen-inner">
          <div className="error-message">
            <p>Error cargando facturas</p>
            <p className="text-secondary">{invoicesQuery.error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header 
        title="Facturas" 
        onBack={() => navigate('/dashboard')}
        onAction={handleLogout}
        actionLabel="Salir"
      />

      <div className="screen-content">
        <div className="screen-inner">
          {/* RESUMEN */}
          <Card className="invoices-summary">
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">Total</span>
                <span className="summary-value">${totals.totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pagado</span>
                <span className="summary-value success">${totals.paidAmount.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pendiente</span>
                <span className="summary-value warning">${totals.pendingAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* FILTROS */}
          <div className="invoices-filters">
            {['Todos', 'Paid', 'Unpaid', 'Overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* LISTA */}
          <div className="invoices-list">
            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <InvoiceIcon size={48} color="#D1D5DB" />
                <p>No hay facturas para mostrar</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="invoice-item">
                  <div className="invoice-content">
                    <div className="invoice-left">
                      <h4 className="invoice-number">{invoice.invoicenum}</h4>
                      <p className="invoice-client">
                        {invoice.firstname || ''} {invoice.lastname || ''}
                      </p>
                      <p className="invoice-date">
                        Fecha: {new Date(invoice.date).toLocaleDateString('es-ES')}
                      </p>
                      {invoice.duedate && invoice.duedate !== '0000-00-00' && (
                        <p className="invoice-duedate">
                          Vencimiento: {new Date(invoice.duedate).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {invoice.notes && (
                        <p className="invoice-notes">{invoice.notes}</p>
                      )}
                    </div>
                    <div className="invoice-right">
                      <span className="invoice-total">
                        ${parseFloat(invoice.total || '0').toFixed(2)}
                      </span>
                      <Badge 
                        variant={
                          invoice.status === 'Paid' ? 'success' :
                          invoice.status === 'Overdue' ? 'danger' : 'warning'
                        }
                      >
                        {invoice.status}
                      </Badge>
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
        }}
      />
    </div>
  );
}