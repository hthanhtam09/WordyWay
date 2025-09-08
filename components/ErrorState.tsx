import React from "react";

interface ErrorStateProps {
    title: string;
    description: string;
    actions?: React.ReactNode;
    className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    title,
    description,
    actions,
    className = "",
}) => {
    return (
        <div
            className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className}`}
        >
            <div className="text-center max-w-md mx-auto px-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
                {actions && <div className="space-y-3">{actions}</div>}
            </div>
        </div>
    );
};

export default ErrorState;

