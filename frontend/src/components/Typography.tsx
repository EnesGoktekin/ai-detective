import React, { createElement } from 'react';

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  children,
  className = '',
  gold = false,
}) => {
  const tag = `h${level}`;
  
  const styles = {
    1: 'text-5xl md:text-6xl font-bold',
    2: 'text-4xl md:text-5xl font-bold',
    3: 'text-3xl md:text-4xl font-semibold',
    4: 'text-2xl md:text-3xl font-semibold',
    5: 'text-xl md:text-2xl font-medium',
    6: 'text-lg md:text-xl font-medium',
  };
  
  const colorStyle = gold ? 'text-gold-500' : 'text-white';
  
  return createElement(
    tag,
    { className: `${styles[level]} ${colorStyle} ${className}` },
    children
  );
};

interface TextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'disabled';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

export const Text: React.FC<TextProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'base',
}) => {
  const variantStyles = {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    disabled: 'text-gray-500',
  };
  
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  return (
    <p className={`${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </p>
  );
};
