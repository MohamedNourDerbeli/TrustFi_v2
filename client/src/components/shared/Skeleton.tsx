// components/shared/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Banner skeleton */}
      <Skeleton height={200} className="w-full" />
      
      <div className="p-6">
        {/* Avatar skeleton */}
        <div className="flex items-center gap-4 -mt-16 mb-4">
          <Skeleton variant="circular" width={96} height={96} className="border-4 border-white dark:border-gray-800" />
          <div className="flex-1 mt-12">
            <Skeleton height={24} width="60%" className="mb-2" />
            <Skeleton height={16} width="40%" />
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mb-4">
          <Skeleton height={16} className="mb-2" />
          <Skeleton height={16} width="90%" className="mb-2" />
          <Skeleton height={16} width="70%" />
        </div>

        {/* Social links skeleton */}
        <div className="flex gap-2">
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
    </div>
  );
};

// Card Grid Skeleton
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Single Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <Skeleton height={200} className="w-full" />
      <div className="p-4">
        <Skeleton height={20} className="mb-2" />
        <Skeleton height={16} width="80%" className="mb-3" />
        <div className="flex justify-between items-center">
          <Skeleton width={60} height={24} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
    </div>
  );
};

// Template List Skeleton
export const TemplateListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Skeleton height={24} width="40%" className="mb-2" />
              <Skeleton height={16} width="60%" />
            </div>
            <Skeleton width={80} height={32} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Skeleton height={14} width="60%" className="mb-1" />
              <Skeleton height={20} width="80%" />
            </div>
            <div>
              <Skeleton height={14} width="60%" className="mb-1" />
              <Skeleton height={20} width="80%" />
            </div>
            <div>
              <Skeleton height={14} width="60%" className="mb-1" />
              <Skeleton height={20} width="80%" />
            </div>
            <div>
              <Skeleton height={14} width="60%" className="mb-1" />
              <Skeleton height={20} width="80%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton height={16} width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height={16} width="90%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <Skeleton height={16} width="60%" className="mb-2" />
          <Skeleton height={32} width="40%" className="mb-2" />
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>
  );
};
