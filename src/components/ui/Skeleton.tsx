import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4 my-1';
      case 'card':
        return 'rounded-xl h-36';
      case 'rectangular':
      default:
        return 'rounded-lg';
    }
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined
  };

  return (
    <div
      style={style}
      className={`bg-slate-200/80 dark:bg-slate-800/80 shimmer-wrapper ${getVariantStyles()} ${className}`}
    />
  );
};

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <div className="flex items-baseline gap-2">
        <Skeleton variant="text" className="w-20 h-7" />
        <Skeleton variant="text" className="w-8 h-4" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton variant="text" className="w-28 h-3" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>
    </div>
  );
};

export const TaskCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-16 h-3.5" />
        <Skeleton variant="text" className="w-12 h-3.5" />
      </div>
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-3/4 h-3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="circular" className="w-6 h-6" />
        <Skeleton variant="text" className="w-14 h-4" />
      </div>
    </div>
  );
};
