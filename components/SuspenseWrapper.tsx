"use client";

import React, { Suspense, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface SuspenseWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
}

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
    children,
    fallback,
}) => {
    const defaultFallback = <LoadingSpinner />;

    return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
};

export default SuspenseWrapper;
