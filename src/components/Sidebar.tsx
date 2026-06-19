import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
  HomeIcon,
  BuildingIcon,
  InvoiceIcon,
  DollarIcon,
  BellIcon,
  UsersIcon,
  LogOutIcon,
  SettingsIcon,
  XIcon,
} from './Icons';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
}

export function Sidebar({ isOpen, onClose, adminName = 'Admin' }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* HEADER */}
        <div className="sidebar-header">
          <div className="sidebar-title">Colmena</div>
          <button className="sidebar-close" onClick={onClose}>
            <XIcon size={24} />
          </button>
        </div>

        {/* PROFILE */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-name">{adminName}</div>
            <div className="profile-role">Administrador</div>
          </div>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/dashboard')}
          >
            <HomeIcon size={20} />
            <span>Dashboard</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/condominios')}
          >
            <BuildingIcon size={20} />
            <span>Condominios</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/invoices')}
          >
            <InvoiceIcon size={20} />
            <span>Facturas</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/invoices')}
          >
            <DollarIcon size={20} />
            <span>Pagos</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/notifications')}
          >
            <BellIcon size={20} />
            <span>Notificaciones</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/users')}
          >
            <UsersIcon size={20} />
            <span>Usuarios</span>
          </button>

          <button
            className="sidebar-menu-item"
            onClick={() => handleNavigate('/account')}
          >
            <SettingsIcon size={20} />
            <span>Cuenta</span>
          </button>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOutIcon size={20} />
            <span>Cerrar sesión</span>
          </button>

          {/* FOOTER */}
        

        </nav>

        
      </div>
    </>
  );
}