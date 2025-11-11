import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { ClassifiedError } from '@/utils/errorClassification';

interface SectionErrorFallbackProps {
  error: ClassifiedError;
  onRetry?: () => void;
  title?: string;
}

/**
 * Error fallback component for individual sections
 * Shows user-friendly error messages with retry option
 */
export function SectionErrorFallback({ 
  error, 
  onRetry,
  title = 'Failed to load data'
}: SectionErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 border-2 border-dashed rounded-lg bg-muted/20">
      <div className="text-destructive">
        <AlertCircle className="w-10 h-10 mx-auto" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.userMessage}
        </p>
      </div>
      {error.retryable && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
