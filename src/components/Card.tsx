import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'stat' | 'interactive';
}

export function Card({ 
  children, 
  className = '', 
  onClick,
  variant = 'default'
}: CardProps) {
  return (
    <div 
      className={`card card--${variant} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}