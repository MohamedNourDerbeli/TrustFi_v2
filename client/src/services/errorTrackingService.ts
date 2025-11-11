/**
 * Error Tracking Service
 * Comprehensive error logging with context, performance monitoring, and analytics
 */

import { classifyError, type ClassifiedError } from '@/utils/errorClassification';

export interface ErrorContext {
  // User context
  userAddress?: string;
  userRole?: string;
  hasProfile?: boolean;
  
  // Page context
  page?: string;
  component?: string;
  action?: string;
  
  // Technical context
  network?: string;
  provider?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  error: ClassifiedError;
  context: ErrorContext;
  stackTrace?: string;
  userAgent: string;
  url: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  name: string;
  duration: number;
  context: ErrorContext;
  metadata?: Record<string, any>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByPage: Record<string, number>;
  recentErrors: ErrorLog[];
  averageErrorsPerHour: number;
}

export interface PerformanceStats {
  totalMetrics: number;
  averageLoadTime: number;
  slowestOperations: PerformanceMetric[];
  metricsByName: Record<string, { count: number; avgDuration: number }>;
}

class ErrorTrackingService {
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxLogs = 1000; // Maximum number of logs to keep in memory
  private maxMetrics = 500; // Maximum number of metrics to keep
  private enabled = true;
  
  // Storage keys
  private readonly ERROR_LOGS_KEY = 'trustfi_error_logs';
  private readonly PERFORMANCE_METRICS_KEY = 'trustfi_performance_metrics';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Enable or disable error tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log an error with context
   */
  logError(error: unknown, context: ErrorContext = {}): ErrorLog {
    if (!this.enabled) {
      return this.createErrorLog(error, context);
    }

    const errorLog = this.createErrorLog(error, context);
    
    // Add to logs
    this.errorLogs.unshift(errorLog);
    
    // Trim logs if exceeding max
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }
    
    // Save to storage
    this.saveToStorage();
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorTracking]', {
        type: errorLog.error.type,
        message: errorLog.error.message,
        context: errorLog.context,
        error: errorLog.error.originalError
      });
    }
    
    return errorLog;
  }

  /**
   * Log a performance metric
   */
  logPerformance(
    name: string,
    duration: number,
    context: ErrorContext = {},
    metadata?: Record<string, any>
  ): PerformanceMetric {
    if (!this.enabled) {
      return this.createPerformanceMetric(name, duration, context, metadata);
    }

    const metric = this.createPerformanceMetric(name, duration, context, metadata);
    
    // Add to metrics
    this.performanceMetrics.unshift(metric);
    
    // Trim metrics if exceeding max
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.maxMetrics);
    }
    
    // Save to storage
    this.saveToStorage();
    
    // Log slow operations in development
    if (import.meta.env.DEV && duration > 1000) {
      console.warn('[Performance] Slow operation detected:', {
        name,
        duration: `${duration}ms`,
        context
      });
    }
    
    return metric;
  }

  /**
   * Track an async operation's performance
   */
  async trackOperation<T>(
    name: string,
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.logPerformance(name, duration, context, { success: true });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.logPerformance(name, duration, context, { success: false });
      this.logError(error, { ...context, action: name });
      
      throw error;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeRange?: { start: number; end: number }): ErrorStats {
    let logs = this.errorLogs;
    
    // Filter by time range if provided
    if (timeRange) {
      logs = logs.filter(
        log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }
    
    // Calculate stats
    const errorsByType: Record<string, number> = {};
    const errorsByPage: Record<string, number> = {};
    
    logs.forEach(log => {
      // Count by type
      const type = log.error.type;
      errorsByType[type] = (errorsByType[type] || 0) + 1;
      
      // Count by page
      const page = log.context.page || 'unknown';
      errorsByPage[page] = (errorsByPage[page] || 0) + 1;
    });
    
    // Calculate average errors per hour
    const timeSpan = timeRange 
      ? (timeRange.end - timeRange.start) / (1000 * 60 * 60)
      : 24; // Default to 24 hours
    const averageErrorsPerHour = logs.length / timeSpan;
    
    return {
      totalErrors: logs.length,
      errorsByType,
      errorsByPage,
      recentErrors: logs.slice(0, 10),
      averageErrorsPerHour
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeRange?: { start: number; end: number }): PerformanceStats {
    let metrics = this.performanceMetrics;
    
    // Filter by time range if provided
    if (timeRange) {
      metrics = metrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }
    
    // Calculate stats
    const metricsByName: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};
    
    metrics.forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }
      
      metricsByName[metric.name].count++;
      metricsByName[metric.name].totalDuration += metric.duration;
    });
    
    // Calculate averages
    Object.keys(metricsByName).forEach(name => {
      const data = metricsByName[name];
      data.avgDuration = data.totalDuration / data.count;
    });
    
    // Calculate overall average
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageLoadTime = metrics.length > 0 ? totalDuration / metrics.length : 0;
    
    // Get slowest operations
    const slowestOperations = [...metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    return {
      totalMetrics: metrics.length,
      averageLoadTime,
      slowestOperations,
      metricsByName: Object.fromEntries(
        Object.entries(metricsByName).map(([name, data]) => [
          name,
          { count: data.count, avgDuration: data.avgDuration }
        ])
      )
    };
  }

  /**
   * Get all error logs
   */
  getErrorLogs(limit?: number): ErrorLog[] {
    return limit ? this.errorLogs.slice(0, limit) : [...this.errorLogs];
  }

  /**
   * Get all performance metrics
   */
  getPerformanceMetrics(limit?: number): PerformanceMetric[] {
    return limit ? this.performanceMetrics.slice(0, limit) : [...this.performanceMetrics];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.errorLogs = [];
    this.performanceMetrics = [];
    this.saveToStorage();
  }

  /**
   * Clear logs older than specified time
   */
  clearOldLogs(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(
      metric => metric.timestamp > cutoff
    );
    
    this.saveToStorage();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      errorLogs: this.errorLogs,
      performanceMetrics: this.performanceMetrics,
      exportedAt: Date.now()
    }, null, 2);
  }

  /**
   * Create an error log entry
   */
  private createErrorLog(error: unknown, context: ErrorContext): ErrorLog {
    const classified = classifyError(error);
    
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      error: classified,
      context,
      stackTrace: error instanceof Error ? error.stack : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Create a performance metric entry
   */
  private createPerformanceMetric(
    name: string,
    duration: number,
    context: ErrorContext,
    metadata?: Record<string, any>
  ): PerformanceMetric {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      name,
      duration,
      context,
      metadata
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    try {
      // Save error logs (keep last 100)
      const recentErrors = this.errorLogs.slice(0, 100);
      localStorage.setItem(this.ERROR_LOGS_KEY, JSON.stringify(recentErrors));
      
      // Save performance metrics (keep last 50)
      const recentMetrics = this.performanceMetrics.slice(0, 50);
      localStorage.setItem(this.PERFORMANCE_METRICS_KEY, JSON.stringify(recentMetrics));
    } catch (error) {
      // Ignore storage errors (e.g., quota exceeded)
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load error logs
      const errorLogsJson = localStorage.getItem(this.ERROR_LOGS_KEY);
      if (errorLogsJson) {
        this.errorLogs = JSON.parse(errorLogsJson);
      }
      
      // Load performance metrics
      const metricsJson = localStorage.getItem(this.PERFORMANCE_METRICS_KEY);
      if (metricsJson) {
        this.performanceMetrics = JSON.parse(metricsJson);
      }
    } catch (error) {
      // Ignore parsing errors
      console.warn('Failed to load logs from storage:', error);
    }
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Export convenience functions
export const logError = (error: unknown, context?: ErrorContext) => 
  errorTrackingService.logError(error, context);

export const logPerformance = (
  name: string,
  duration: number,
  context?: ErrorContext,
  metadata?: Record<string, any>
) => errorTrackingService.logPerformance(name, duration, context, metadata);

export const trackOperation = <T>(
  name: string,
  operation: () => Promise<T>,
  context?: ErrorContext
) => errorTrackingService.trackOperation(name, operation, context);
