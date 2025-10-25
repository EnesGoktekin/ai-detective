import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverStyles = hover
    ? 'hover:bg-dark-elevated hover:border-gold-500/50 hover:shadow-gold transition-all duration-200 cursor-pointer'
    : '';
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-dark-surface border-2 border-dark-border rounded-lg
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
