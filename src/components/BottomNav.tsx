import { useState } from 'react';
import {
  HomeIcon,
  BuildingIcon,
  InvoiceIcon,
  DollarIcon,
  MoreIcon,
  TicketIcon,
} from './Icons';
import './BottomNav.css';

interface BottomNavProps {
  active: string;
  onChange: (nav: string) => void;
  onNavigate: (nav: string) => void;
}

export function BottomNav({ active, onChange, onNavigate }: BottomNavProps) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'condominios', label: 'Condominios', icon: BuildingIcon },
    { id: 'invoices', label: 'Facturas', icon: InvoiceIcon },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon },
    { id: 'pagos', label: 'Pagos', icon: DollarIcon },
    { id: 'mas', label: 'Más', icon: MoreIcon },
  ];

  const handleClick = (id: string) => {
    onChange(id);
    onNavigate(id);
  };

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => handleClick(item.id)}
            title={item.label}
          >
            <Icon size={24} color="currentColor" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}