import React from 'react';
import './Avatar.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Colores predefinidos basados en nombre
  const colors = [
    '#7C3AED', '#EC4899', '#F59E0B',
    '#10B981', '#3B82F6', '#6366F1',
    '#8B5CF6', '#06B6D4'
  ];
  
  const bgColor = color || colors[name.charCodeAt(0) % colors.length];

  return (
    <div 
      className={`avatar avatar--${size}`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      <span className="avatar-text">{initials}</span>
    </div>
  );
}