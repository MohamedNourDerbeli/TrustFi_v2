# Error Tracking System

## Overview

The error tracking system provides comprehensive error logging, performance monitoring, and debugging capabilities for the TrustFi application. It automatically captures contract errors, network issues, and performance metrics to help identify and resolve issues quickly.

## Features

- **Automatic Error Logging**: All contract errors are automatically logged with context
- **Performance Monitoring**: Track operation durations and identify slow operations
- **Error Classification**: Errors are classified by type with user-friendly messages
- **Persistent Storage**: Logs are stored in localStorage for debugging
- **Error Dashboard**: Admin-only dashboard for viewing errors and metrics
- **Export Functionality**: Export logs as JSON for analysis

## Architecture

### Core Components

1. **errorTrackingService.ts**: Central service for logging errors and performance metrics
2. **errorClassification.ts**: Classifies errors and provides user-friendly messages
3. **ErrorDashboard.tsx**: Admin UI for viewing logs and metrics
4. **useContractData.ts**: Hook integration for automatic tracking

## Usage

### Logging Errors

```typescript
import { logError } from '@/services/errorTrackingService';

try {
  await someOperation();
} catch (error) {
  logError(error, {
    page: 'Dashboard',
    component: 'ProfileCard',
    action: 'loadProfile',
    userAddress: address
  });
  throw error;
}
```

### Tracking Performance

```typescript
import { logPerformance } from '@/services/errorTrackingService';

const startTime = performance.now();
const result = await fetchData();
const duration = performance.now() - startTime;

logPerformance('fetchProfileData', duration, {
  page: 'Dashboard',
  component: 'ProfileCard'
});
```

### Tracking Operations (Combined)

```typescript
import { trackOperation } from '@/services/errorTrackingService';

const result = await trackOperation(
  'createProfile',
  async () => {
    return await contractService.createProfile(metadataURI);
  },
  {
    page: 'Dashboard',
    action: 'createProfile',
    userAddress: address
  }
);
```

### Using with Hooks

The `useContractData` hook automatically tracks errors and performance:

```typescript
const { data, loading, error } = useContractData(
  () => contractService.getProfile(address),
  [address],
  {
    operationName: 'getProfile',
    page: 'Dashboard',
    component: 'ProfileCard'
  }
);
```

## Error Context

Error context provides additional information about where and when an error occurred:

```typescript
interface ErrorContext {
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
```

## Error Dashboard

The error dashboard is available at `/debug/errors` (admin only) and provides:

- **Error Statistics**: Total errors, errors per hour, error distribution
- **Error Logs**: Recent errors with full context and classification
- **Performance Metrics**: Operation durations, slowest operations
- **Export/Clear**: Export logs or clear old data

### Accessing the Dashboard

1. Connect wallet as admin
2. Navigate to `/debug/errors`
3. View errors and performance metrics
4. Filter by time range (1h, 24h, 7d, all)
5. Export logs for external analysis

## Error Types

The system classifies errors into the following types:

- **NETWORK_ERROR**: Network connectivity issues, unsupported networks
- **VALIDATION_ERROR**: Input validation failures
- **TRANSACTION_ERROR**: Transaction failures, user rejections
- **AUTHORIZATION_ERROR**: Permission denied errors
- **NOT_FOUND_ERROR**: Resource not found errors
- **INITIALIZATION_ERROR**: Service initialization failures
- **UNKNOWN_ERROR**: Unclassified errors

## Performance Metrics

Performance metrics track:

- Operation duration
- Success/failure status
- Context (page, component, action)
- Metadata (custom data)

### Slow Operation Thresholds

- **< 1000ms**: Normal (green)
- **1000-3000ms**: Slow (orange)
- **> 3000ms**: Very slow (red)

## Storage

Logs are stored in localStorage with the following limits:

- **Error Logs**: Last 100 errors
- **Performance Metrics**: Last 50 metrics
- **In-Memory**: Up to 1000 errors and 500 metrics

Old logs are automatically trimmed to prevent storage overflow.

## Best Practices

1. **Always provide context**: Include page, component, and action information
2. **Use trackOperation for async operations**: Automatically logs both errors and performance
3. **Don't log sensitive data**: Avoid logging private keys, passwords, or PII
4. **Review logs regularly**: Check the dashboard for patterns and issues
5. **Export logs for analysis**: Use the export feature for detailed investigation

## Integration Examples

### Contract Service

```typescript
class ContractService {
  private async trackContractOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    return await trackOperation(operationName, operation, {
      component: 'ContractService',
      network: this.chainId,
      ...context
    });
  }

  async createProfile(metadataURI: string): Promise<number> {
    return this.trackContractOperation(
      'createProfile',
      async () => {
        // Implementation
      },
      { action: 'createProfile' }
    );
  }
}
```

### React Component

```typescript
function ProfileCard() {
  const { address } = useWallet();
  
  const handleUpdate = async () => {
    try {
      await trackOperation(
        'updateProfile',
        async () => {
          return await profileService.update(data);
        },
        {
          page: 'Dashboard',
          component: 'ProfileCard',
          userAddress: address
        }
      );
    } catch (error) {
      // Error is automatically logged
      toast.error('Failed to update profile');
    }
  };
}
```

## Disabling Error Tracking

To disable error tracking (e.g., in tests):

```typescript
import { errorTrackingService } from '@/services/errorTrackingService';

errorTrackingService.setEnabled(false);
```

## Future Enhancements

- Integration with external monitoring services (Sentry, DataDog)
- Real-time error notifications
- Error rate alerts
- Performance regression detection
- User session replay
- Error grouping and deduplication
