/**
 * Error Dashboard Component
 * Displays error logs and performance metrics for debugging
 */

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Activity, 
  Download, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import {
  errorTrackingService,
  type ErrorLog,
  type PerformanceMetric,
  type ErrorStats,
  type PerformanceStats
} from '@/services/errorTrackingService';
import { format } from 'date-fns';

export function ErrorDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [activeTab, setActiveTab] = useState<'errors' | 'performance'>('errors');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('24h');

  const loadData = () => {
    // Calculate time range
    const now = Date.now();
    let start = 0;
    
    switch (timeRange) {
      case '1h':
        start = now - (60 * 60 * 1000);
        break;
      case '24h':
        start = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        start = 0;
    }

    const range = start > 0 ? { start, end: now } : undefined;

    // Load stats
    setErrorStats(errorTrackingService.getErrorStats(range));
    setPerformanceStats(errorTrackingService.getPerformanceStats(range));
    
    // Load logs
    setErrorLogs(errorTrackingService.getErrorLogs(50));
    setPerformanceMetrics(errorTrackingService.getPerformanceMetrics(50));
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const handleExport = () => {
    const data = errorTrackingService.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustfi-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      errorTrackingService.clearLogs();
      loadData();
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'VALIDATION_ERROR':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'TRANSACTION_ERROR':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'AUTHORIZATION_ERROR':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'NOT_FOUND_ERROR':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'INITIALIZATION_ERROR':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor errors and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['1h', '24h', '7d', 'all'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '1h' && 'Last Hour'}
            {range === '24h' && 'Last 24 Hours'}
            {range === '7d' && 'Last 7 Days'}
            {range === 'all' && 'All Time'}
          </Button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Errors</p>
              <p className="text-2xl font-bold">{errorStats?.totalErrors || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errors/Hour</p>
              <p className="text-2xl font-bold">
                {errorStats?.averageErrorsPerHour.toFixed(1) || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Load Time</p>
              <p className="text-2xl font-bold">
                {formatDuration(performanceStats?.averageLoadTime || 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Operations</p>
              <p className="text-2xl font-bold">
                {performanceStats?.totalMetrics || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'errors'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('errors')}
        >
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Errors
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'performance'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Performance
        </button>
      </div>

      {/* Content */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          {/* Error Type Distribution */}
          {errorStats && Object.keys(errorStats.errorsByType).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Errors by Type</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(errorStats.errorsByType).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={getErrorTypeColor(type)}
                  >
                    {type.replace('_', ' ')}: {count}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Error Logs */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Recent Errors</h3>
            <div className="space-y-3">
              {errorLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No errors logged</p>
                </div>
              ) : (
                errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={getErrorTypeColor(log.error.type)}
                          >
                            {log.error.type.replace('_', ' ')}
                          </Badge>
                          {log.context.page && (
                            <Badge variant="outline">
                              {log.context.page}
                            </Badge>
                          )}
                          {log.context.action && (
                            <Badge variant="outline" className="bg-blue-500/10">
                              {log.context.action}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {log.error.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.error.userMessage}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(log.timestamp, 'MMM d, HH:mm:ss')}
                      </div>
                    </div>
                    
                    {log.context.userAddress && (
                      <p className="text-xs text-muted-foreground">
                        User: {log.context.userAddress.slice(0, 6)}...{log.context.userAddress.slice(-4)}
                      </p>
                    )}
                    
                    {log.error.retryable && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <RefreshCw className="w-3 h-3" />
                        Retryable
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Performance by Operation */}
          {performanceStats && Object.keys(performanceStats.metricsByName).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Performance by Operation</h3>
              <div className="space-y-2">
                {Object.entries(performanceStats.metricsByName)
                  .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
                  .map(([name, data]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} calls
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">
                          {formatDuration(data.avgDuration)}
                        </p>
                        <p className="text-xs text-muted-foreground">avg</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Slowest Operations */}
          {performanceStats && performanceStats.slowestOperations.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Slowest Operations</h3>
              <div className="space-y-2">
                {performanceStats.slowestOperations.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{metric.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {metric.context.page && (
                          <Badge variant="outline" className="text-xs">
                            {metric.context.page}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(metric.timestamp, 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono ${
                        metric.duration > 3000 ? 'text-red-500' :
                        metric.duration > 1000 ? 'text-orange-500' :
                        'text-green-500'
                      }`}>
                        {formatDuration(metric.duration)}
                      </p>
                      {metric.metadata?.success === false && (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
      </div>
    </>
  );
}
