import React from 'react';
import { MenuIcon, BellIcon } from './Icons';
import './Header.css';

// Logo SVG inline - no necesita archivo externo
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="4" fill="#02152F" stroke="#FFFFFF" strokeWidth="2"/>
    <path d="M10 12H22M10 16H22M10 20H18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
  onBack?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  notificationCount?: number;
}

export function Header({
  title = '',
  showLogo = false,
  showMenu = false,
  onMenuClick,
  onBack,
  onAction,
  actionLabel = 'Logout',
  notificationCount = 0,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        {showMenu && (
          <button 
            className="header-btn header-menu-btn" 
            onClick={onMenuClick}
            title="Menú"
          >
            <MenuIcon size={24} />
          </button>
        )}
        {onBack && (
          <button className="header-btn" onClick={onBack} title="Atrás">
            ←
          </button>
        )}
        {showLogo && (
          <div className="header-logo">
            <div className="header-logo-img">
              <LogoIcon />
            </div>
            <div className="header-logo-text">
              <div className="logo-brand">Colmena</div>
              <div className="logo-subtitle">Gestión</div>
            </div>
          </div>
        )}
        {title && <h1 className="header-title">{title}</h1>}
      </div>

      <div className="header-right">
        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="notification-bell">
          <button className="bell-btn" title="Notificaciones">
            <BellIcon size={20} color="white" />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>
        </div>

        {onAction && (
          <button className="header-btn header-logout" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}