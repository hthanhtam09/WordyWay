import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-background ${className}`}
    >
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action && <div className="space-y-3">{action}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
