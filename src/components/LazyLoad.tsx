import React, { Suspense, ComponentType, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function lazyLoad(
  importFunc: () => Promise<{ default: ComponentType }>
): React.FC<LazyLoadProps> {
  const LazyComponent = lazy(importFunc);

  const WrappedComponent: React.FC<LazyLoadProps> = ({ fallback = <DefaultFallback /> }) => {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `LazyLoad(Component)`;

  return WrappedComponent;
}

export const LazyLoad: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <DefaultFallback /> }) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};
