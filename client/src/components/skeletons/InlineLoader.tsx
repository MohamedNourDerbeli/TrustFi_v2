import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoader({ 
  message, 
  size = 'md',
  className 
}: InlineLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {message}
        </span>
      )}
    </div>
  );
}
