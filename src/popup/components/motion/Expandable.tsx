import React from 'react';

interface ExpandableProps {
  expanded: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Expandable: React.FC<ExpandableProps> = ({ expanded, children, className = '' }) => {
  return (
    <div
      className={`expandable-grid ${expanded ? 'expandable-open' : 'expandable-closed'} ${className}`}
      aria-hidden={!expanded}
    >
      <div className="expandable-inner">
        {children}
      </div>
    </div>
  );
};
