import React from 'react';
import { Card } from './Card';
import './StatCard.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  spark?: number[];
  color?: string;
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  change,
  spark,
  color = '#0052CC'
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card variant="stat" className="stat-card">
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <h4 className="stat-label">{label}</h4>
      <div className="stat-value">{value}</div>
      
      {change !== undefined && (
        <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-arrow">
            {isPositive ? '↑' : '↓'}
          </span>
          <span>{Math.abs(change)}%</span>
          <span className="change-label">vs. mes anterior</span>
        </div>
      )}
      
      {spark && (
        <div className="stat-spark">
          <svg width="100%" height="40" viewBox="0 0 100 40">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={spark
                .map((v, i) => `${(i / (spark.length - 1)) * 100},${40 - (v / Math.max(...spark)) * 35}`)
                .join(' ')}
            />
          </svg>
        </div>
      )}
    </Card>
  );
}