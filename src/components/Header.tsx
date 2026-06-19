import React from 'react';
import { MenuIcon, BellIcon } from './Icons';
import './Header.css';

// Logo SVG inline - no necesita archivo externo
const LogoIcon = () => (
  <img 
    src="/logo-icon.png" 
    alt="Colmena" 
    style={{ 
      width: '32px', 
      height: '32px',
      objectFit: 'contain'
    }}
  />
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