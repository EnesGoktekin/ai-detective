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
    ? 'hover:bg-dark-elevated hover:border-gold-500/50 hover:shadow-gold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500'
    : '';
  
  return (
    <div
      onClick={onClick}
      tabIndex={hover ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
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
