# Error Handling Components Usage Guide

This guide explains how to use the error handling components in the TrustFi platform.

## Components Overview

### 1. ErrorBoundary
Catches and handles React errors gracefully to prevent entire app crashes.

### 2. ErrorFallback
Displays user-friendly error messages with contextual information and actions.

### 3. TransactionStatus
Shows blockchain transaction progress with clear visual feedback.

---

## ErrorBoundary

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/shared';

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
import { ErrorBoundary, ErrorFallback } from '@/components/shared';

function MyPage() {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback error={new Error('Custom error')} />}
      onError={(error, errorInfo) => {
        console.error('Caught error:', error, errorInfo);
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Reset Keys

Reset the error boundary when certain values change (e.g., user address):

```tsx
import { ErrorBoundary } from '@/components/shared';
import { useWallet } from '@/contexts/WalletContext';

function MyPage() {
  const { address } = useWallet();
  
  return (
    <ErrorBoundary resetKeys={[address]}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## ErrorFallback

### Full Error Display

```tsx
import { ErrorFallback } from '@/components/shared';

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetError={() => setError(null)}
        title="Failed to Load Data"
        showRetry={true}
      />
    );
  }

  return <div>Content</div>;
}
```

### Compact Error Display

For inline errors in smaller spaces:

```tsx
import { ErrorFallback } from '@/components/shared';

function MyComponent() {
  const { data, error, refetch } = useContractData();

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetError={refetch}
        compact={true}
      />
    );
  }

  return <div>{data}</div>;
}
```

### Simple Error Message

For minimal error display:

```tsx
import { ErrorMessage } from '@/components/shared';

function MyComponent() {
  const { error } = useContractData();

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return <div>Content</div>;
}
```

---

## TransactionStatus

### Full Transaction Modal

```tsx
import { useState } from 'react';
import { TransactionStatus, TransactionStatusType } from '@/components/shared';

function IssueCredential() {
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  const handleIssue = async () => {
    try {
      setTxStatus('pending');
      
      const tx = await contractService.issueCredential(data);
      setTxStatus('confirming');
      setTxHash(tx.hash);
      
      await tx.wait();
      setTxStatus('success');
    } catch (err) {
      setTxStatus('error');
      setError(err.message);
    }
  };

  return (
    <>
      <button onClick={handleIssue}>Issue Credential</button>
      
      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        error={error}
        title="Issue Credential"
        successMessage="Credential issued successfully!"
        onClose={() => setTxStatus('idle')}
      />
    </>
  );
}
```

### Inline Transaction Status

For compact transaction feedback:

```tsx
import { InlineTransactionStatus } from '@/components/shared';

function MyComponent() {
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');

  return (
    <div>
      <button onClick={handleTransaction}>Submit</button>
      <InlineTransactionStatus 
        status={txStatus}
        message="Processing your request..."
      />
    </div>
  );
}
```

---

## Complete Example: Page with Error Handling

```tsx
import { useState, useEffect } from 'react';
import { 
  ErrorBoundary, 
  ErrorFallback, 
  TransactionStatus,
  TransactionStatusType 
} from '@/components/shared';
import { useWallet } from '@/contexts/WalletContext';
import { useContractData } from '@/hooks/useContractData';

function DashboardPage() {
  const { address } = useWallet();
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [txHash, setTxHash] = useState<string>();
  
  const { 
    data: profile, 
    loading, 
    error, 
    refetch 
  } = useContractData(
    () => contractService.getProfile(address),
    [address]
  );

  const handleAction = async () => {
    try {
      setTxStatus('pending');
      const tx = await contractService.doSomething();
      
      setTxStatus('confirming');
      setTxHash(tx.hash);
      
      await tx.wait();
      setTxStatus('success');
      
      // Refresh data after successful transaction
      await refetch();
    } catch (err) {
      setTxStatus('error');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetError={refetch}
        title="Failed to Load Dashboard"
      />
    );
  }

  return (
    <ErrorBoundary resetKeys={[address]}>
      <div>
        <h1>Dashboard</h1>
        <button onClick={handleAction}>Perform Action</button>
        
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          title="Transaction"
          onClose={() => setTxStatus('idle')}
        />
      </div>
    </ErrorBoundary>
  );
}

export default DashboardPage;
```

---

## Error Classification

All error components automatically classify errors using the `classifyError` utility:

- **Network Errors**: Connection issues, unsupported networks
- **Transaction Errors**: User rejection, insufficient funds, gas errors
- **Validation Errors**: Invalid input, missing data
- **Authorization Errors**: Insufficient permissions
- **Initialization Errors**: Service not initialized, wallet not connected

Each error type gets appropriate:
- Icon
- User-friendly message
- Suggested action (retry, reconnect, switch network, etc.)
- Retry capability

---

## Best Practices

1. **Wrap page-level components** in ErrorBoundary to prevent full app crashes
2. **Use resetKeys** to automatically reset errors when context changes
3. **Show transaction status** for all blockchain operations
4. **Provide retry actions** for retryable errors
5. **Use compact variants** for inline errors in cards or lists
6. **Log errors** using the onError callback for monitoring
7. **Refresh data** after successful transactions

---

## Integration with Existing Code

These components work seamlessly with:
- `useContractData` hook for data fetching
- `classifyError` utility for error classification
- `useToast` hook for toast notifications
- Existing UI components (Alert, Dialog, Button, etc.)
