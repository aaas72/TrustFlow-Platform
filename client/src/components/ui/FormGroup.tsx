import type { ReactNode } from 'react';
import React from 'react';

interface FormGroupProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const FormGroup: React.FC<FormGroupProps> = ({ 
  children, 
  className = '', 
  spacing = 'md' 
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

export default FormGroup;